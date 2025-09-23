const fs = require('fs');
const path = require('path');

/**
 * ACF Manager - Generación automática de grupos y campos ACF
 *
 * Genera campos ACF desde metadata.json para componentes comprehensive
 * que usan dataSource con campos ACF configurados.
 */
class ACFManager {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadMetadata();
    this.pageTemplates = this.loadPageTemplates();
  }

  /**
   * Carga metadata de componentes
   */
  loadMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');

    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    throw new Error('❌ ACF MANAGER ERROR: metadata.json no encontrado');
  }

  /**
   * Carga configuración de page templates
   */
  loadPageTemplates() {
    const templatesPath = path.join(this.config.srcDir, 'page-templates.json');

    if (fs.existsSync(templatesPath)) {
      return JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    }

    throw new Error('❌ ACF MANAGER ERROR: page-templates.json no encontrado');
  }

  /**
   * Genera archivo PHP de campos ACF
   */
  generateACFFields() {
    const fieldGroups = this.buildFieldGroups();

    if (Object.keys(fieldGroups).length === 0) {
      return {
        fieldGroups: 0,
        totalFields: 0
      };
    }

    const phpContent = this.generateACFPhp(fieldGroups);

    const outputPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'inc',
      'acf-fields.php'
    );

    // Crear directorio inc si no existe
    const incDir = path.dirname(outputPath);
    if (!fs.existsSync(incDir)) {
      fs.mkdirSync(incDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, phpContent);

    // Generar mapeo de tipos de campo para component-generator
    this.generateFieldTypeMapping(fieldGroups);

    return {
      fieldGroups: Object.keys(fieldGroups).length,
      totalFields: Object.values(fieldGroups).reduce((total, group) => total + group.fields.length, 0)
    };
  }

  /**
   * Genera mapeo de tipos de campo para component-generator
   */
  generateFieldTypeMapping(fieldGroups) {
    const fieldTypeMapping = {};

    for (const [groupKey, group] of Object.entries(fieldGroups)) {
      for (const field of group.fields) {
        if (field._fieldType) {
          fieldTypeMapping[field.name] = {
            type: field._fieldType,
            isImage: field._isImageField
          };
        }
      }
    }

    const mappingPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'inc',
      'acf-field-types.json'
    );

    fs.writeFileSync(mappingPath, JSON.stringify(fieldTypeMapping, null, 2));
  }

  /**
   * Construye grupos de campos ACF desde configuración
   */
  buildFieldGroups() {
    console.log('   pageTemplates:', Object.keys(this.pageTemplates));
    const groups = {};

    try {
      // 1. Analizar componentes comprehensive en páginas
      for (const [pageName, pageConfig] of Object.entries(this.pageTemplates)) {
        const components = pageConfig.components || [];
        console.log(`   Página ${pageName}: ${components.length} componentes`);

        for (const component of components) {
          const metadata = this.metadata[component.name];
          console.log(`   Checking ${component.name}: type=${metadata?.type}`);
          if (!metadata || metadata.type !== 'comprehensive') continue;

        const dataSource = component.dataSource;
        if (!dataSource?.wordpressData?.fields) continue;

        // Verificar si tiene campos ACF
        const hasACFFields = Object.values(dataSource.wordpressData.fields)
          .some(field => field.type === 'acf');

        if (!hasACFFields) continue;

        const groupKey = `group_${component.name.replace('-', '_')}`;
        groups[groupKey] = this.buildFieldGroup(component, metadata, pageName);
      }
    }

    // 2. Analizar componentes aggregated que usen custom post types con ACF
    for (const [pageName, pageConfig] of Object.entries(this.pageTemplates)) {
      console.log(`   Página ${pageName}:`, pageConfig.components?.map(c => c.name));
      const components = pageConfig.components || [];

      for (const component of components) {
        const metadata = this.metadata[component.name];
        console.log(`   Componente ${component.name}: type=${metadata?.type}`);
        if (!metadata || metadata.type !== 'aggregated') continue;

        const dataSource = component.dataSource;
        const fieldsData = dataSource?.mapping;
        if (!fieldsData) continue;

        // DEBUG: Ver qué campos encuentra
        console.log('   fieldsData:', JSON.stringify(fieldsData, null, 2));

        // Verificar si tiene campos ACF
        const hasACFFields = Object.values(fieldsData)
          .some(field => field.type === 'acf');

        // Obtener fieldTypes del metadata para este componente
        const componentMetadata = this.metadata[component.name];
        const fieldTypes = this.extractFieldTypesFromMetadata(componentMetadata);

        console.log(`   hasACFFields: ${hasACFFields}`);

        if (!hasACFFields) continue;

        const postType = dataSource.postType || 'post';
        const groupKey = `group_${postType}_fields`;

        if (!groups[groupKey]) {
          groups[groupKey] = this.buildPostTypeFieldGroupFromAggregation(component, metadata, postType, fieldsData, fieldTypes);
        }
      }
    }

    } catch (error) {
      console.error('❌ ERROR en buildFieldGroups:', error.message);
      console.error('   Stack:', error.stack);
    }

    console.log('   Total grupos generados:', Object.keys(groups).length);
    return groups;
  }

  /**
   * Construye un grupo de campos para custom post types (comprehensive)
   */
  buildPostTypeFieldGroup(component, metadata, postType) {
    const fields = [];
    const dataSource = component.dataSource;

    for (const [paramName, fieldConfig] of Object.entries(dataSource.wordpressData.fields)) {
      if (fieldConfig.type !== 'acf') continue;

      const param = metadata.parameters.find(p => p.name === paramName);
      if (!param) continue;

      const acfField = this.generateACFField(component, param, fieldConfig);
      fields.push(acfField);
    }

    return {
      key: `group_${postType}_fields`,
      title: `${this.generatePostTypeTitle(postType)} Fields`,
      fields: fields,
      location: this.generatePostTypeLocation(postType)
    };
  }

  /**
   * Construye un grupo de campos para custom post types (aggregated)
   */
  buildPostTypeFieldGroupFromAggregation(component, metadata, postType, fieldsData, fieldTypes) {
    const fields = [];

    for (const [fieldName, fieldConfig] of Object.entries(fieldsData)) {
      if (fieldConfig.type !== 'acf') continue;

      // Usar fieldType del metadata.json en lugar de acfFieldType del mapping
      const metadataFieldType = fieldTypes[fieldName];
      if (!metadataFieldType) {
        throw new Error(`❌ ACF FIELD ERROR: Campo '${fieldName}' en componente aggregated requiere fieldType en metadata.json.

🔧 CONFIGURACIÓN REQUERIDA en metadata.json:
"arrayFields": {
  "testimonials": [
    { "name": "${fieldName}", "type": "string", "fieldType": "text|image|number|boolean" }
  ]
}

💡 TIPOS VÁLIDOS: text, image, number, boolean
🚨 SIN FALLBACKS: fieldType obligatorio en metadata.json`);
      }

      // Para componentes aggregated, crear un pseudo-param basado en el fieldName
      const pseudoParam = {
        name: fieldName,
        type: metadataFieldType,
        default: ''
      };

      const acfField = this.generateACFField(component, pseudoParam, fieldConfig, 'aggregated');
      fields.push(acfField);
    }

    return {
      key: `group_${postType}_fields`,
      title: `${this.generatePostTypeTitle(postType)} Fields`,
      fields: fields,
      location: this.generatePostTypeLocation(postType)
    };
  }


  /**
   * Construye un grupo de campos específico para páginas
   */
  buildFieldGroup(component, metadata, pageName) {
    const fields = [];
    const dataSource = component.dataSource;

    for (const [paramName, fieldConfig] of Object.entries(dataSource.wordpressData.fields)) {
      if (fieldConfig.type !== 'acf') continue;

      const param = metadata.parameters.find(p => p.name === paramName);
      if (!param) continue;

      const acfField = this.generateACFField(component, param, fieldConfig);
      fields.push(acfField);
    }

    return {
      key: `group_${component.name.replace('-', '_')}`,
      title: this.generateGroupTitle(component.name),
      fields: fields,
      location: this.generateLocation(pageName)
    };
  }

  extractFieldTypesFromMetadata(componentMetadata) {
    if (!componentMetadata) return {};

    const fieldTypes = {};

    // Para componentes aggregated, extraer fieldTypes de arrayFields
    if (componentMetadata.arrayFields) {
      Object.entries(componentMetadata.arrayFields).forEach(([_, fields]) => {
        fields.forEach(field => {
          if (field.fieldType) {
            fieldTypes[field.name] = field.fieldType;
          }
        });
      });
    }

    // Para componentes simples, extraer de parameters directamente
    if (componentMetadata.parameters) {
      componentMetadata.parameters.forEach(param => {
        if (param.fieldType) {
          fieldTypes[param.name] = param.fieldType;
        }
      });
    }

    return fieldTypes;
  }

  /**
   * Genera un campo ACF individual
   */
  generateACFField(component, param, fieldConfig, componentType = 'unknown') {
    const fieldName = fieldConfig.source.replace('meta_', '');
    const fieldKey = `field_${component.name.replace('-', '_')}_${param.name}`;

    // Mapeo de tipos básicos
    const typeMapping = {
      'string': 'text',
      'text': 'text',
      'textarea': 'textarea',
      'number': 'number',
      'boolean': 'true_false',
      'array': 'repeater',
      'image': 'image'
    };

    // Usar fieldType del metadata.json (pasado en param.type)
    const acfFieldType = param.type;

    if (!acfFieldType) {
      const contextInfo = componentType === 'aggregated'
        ? `dataSource.mapping.${param.name}`
        : `dataSource.fields.${param.name}`;

      throw new Error(`❌ ACF FIELD ERROR: Campo '${param.name}' en componente '${component.name}' (${componentType}) requiere fieldType en metadata.json.

🔧 CONFIGURACIÓN REQUERIDA en metadata.json:
{ "name": "${param.name}", "type": "string", "fieldType": "text|image|number|boolean" }

💡 TIPOS VÁLIDOS: text, image, number, boolean
🚨 SIN FALLBACKS: fieldType obligatorio en metadata.json`);
    }

    const field = {
      key: fieldKey,
      label: this.generateFieldLabel(param.name),
      name: fieldName,
      type: typeMapping[acfFieldType] || 'text'
    };

    // Configuraciones específicas por tipo
    if (acfFieldType === 'boolean') {
      field.default_value = param.default === 'true' ? 1 : 0;
      field.ui = 1;
    }

    if (acfFieldType === 'number') {
      field.min = 0;
      field.step = 1;
    }

    if (acfFieldType === 'image') {
      field.type = 'image';
      field.return_format = 'array';
      field.library = 'all';
      field.min_width = 150;
      field.min_height = 150;
    }

    // Store field type metadata for component generator
    field._isImageField = acfFieldType === 'image';
    field._fieldType = acfFieldType;

    if (param.name.includes('url') || param.name.includes('Url') || param.name.includes('link')) {
      field.type = 'url';
    }

    if (param.name.includes('email') || param.name.includes('Email')) {
      field.type = 'email';
    }

    if (param.name.includes('description') || param.name.includes('content') || param.name.includes('texto')) {
      field.type = 'textarea';
      field.rows = 4;
    }

    // Valor por defecto si existe
    if (param.default && param.type !== 'boolean') {
      field.default_value = param.default;
    }

    return field;
  }

  /**
   * Genera título del grupo de campos
   */
  generateGroupTitle(componentName) {
    return componentName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Component';
  }

  /**
   * Genera label del campo
   */
  generateFieldLabel(paramName) {
    return paramName
      .replace(/([A-Z])/g, ' $1')
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  /**
   * Genera configuración de ubicación para páginas
   */
  generateLocation(pageName) {
    return [
      [
        {
          param: 'page_template',
          operator: '==',
          value: `${pageName}.php`
        }
      ]
    ];
  }

  /**
   * Genera configuración de ubicación para post types
   */
  generatePostTypeLocation(postType) {
    return [
      [
        {
          param: 'post_type',
          operator: '==',
          value: postType
        }
      ]
    ];
  }

  /**
   * Genera título del grupo para post types
   */
  generatePostTypeTitle(postType) {
    return postType.charAt(0).toUpperCase() + postType.slice(1);
  }

  /**
   * Genera el contenido PHP completo
   */
  generateACFPhp(fieldGroups) {
    const groupsCode = Object.values(fieldGroups)
      .map(group => this.generateGroupCode(group))
      .join('\n\n        ');

    return `<?php
/**
 * ACF Fields - Generado automáticamente
 *
 * Campos ACF para componentes comprehensive
 * generados desde metadata.json y page-templates.json
 */

function ${this.config.phpFunctionPrefix}_acf_fields() {
    if (function_exists('acf_add_local_field_group')) {

        ${groupsCode}
    }
}

// Registrar en múltiples hooks para máxima compatibilidad
add_action('acf/init', '${this.config.phpFunctionPrefix}_acf_fields');
add_action('init', '${this.config.phpFunctionPrefix}_acf_fields');
add_action('admin_init', '${this.config.phpFunctionPrefix}_acf_fields');
?>`;
  }

  /**
   * Genera código PHP para un grupo específico
   */
  generateGroupCode(group) {
    const fieldsCode = group.fields
      .map(field => this.generateFieldCode(field))
      .join(',\n                ');

    const locationCode = group.location
      .map(locationGroup =>
        locationGroup.map(rule => `
                    [
                        'param' => '${rule.param}',
                        'operator' => '${rule.operator}',
                        'value' => '${rule.value}',
                    ]`).join(',\n                ')
      ).join(',\n                [');

    return `// ${group.title}
        acf_add_local_field_group([
            'key' => '${group.key}',
            'title' => '${group.title}',
            'fields' => [
                ${fieldsCode}
            ],
            'location' => [
                [${locationCode}
                ],
            ],
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => 'Campos generados automáticamente desde metadata.json',
        ]);`;
  }

  /**
   * Genera código PHP para un campo específico
   */
  generateFieldCode(field) {
    const properties = [];

    for (const [key, value] of Object.entries(field)) {
      if (typeof value === 'string') {
        properties.push(`'${key}' => '${value}'`);
      } else if (typeof value === 'number') {
        properties.push(`'${key}' => ${value}`);
      } else if (typeof value === 'boolean') {
        properties.push(`'${key}' => ${value ? 'true' : 'false'}`);
      } else if (Array.isArray(value)) {
        const arrayItems = value.map(item => `'${item}'`).join(', ');
        properties.push(`'${key}' => [${arrayItems}]`);
      }
    }

    return `[
                    ${properties.join(',\n                    ')},
                ]`;
  }

  /**
   * Obtiene estadísticas de generación
   */
  getStats() {
    const fieldGroups = this.buildFieldGroups();

    return {
      totalGroups: Object.keys(fieldGroups).length,
      totalFields: Object.values(fieldGroups).reduce((total, group) => total + group.fields.length, 0),
      componentsWithACF: Object.keys(fieldGroups).map(key => key.replace('group_', '').replace('_', '-'))
    };
  }
}

module.exports = ACFManager;