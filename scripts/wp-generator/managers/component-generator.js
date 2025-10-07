const fs = require('fs');
const path = require('path');
const ExtensionManager = require('../extensions/extension-manager');
const PhpComponentTemplate = require('../templates/php-components');
const PHPValidator = require('../../validation/validators/php-validator');
const DefaultValueParser = require('../utils/default-value-parser');

class ComponentGenerator {
  constructor(config) {
    this.config = config;

    // 🎯 SINGLE SOURCE OF TRUTH: Usar ConfigSingleton
    const ConfigSingleton = require('../core/config-singleton');
    const configSingleton = ConfigSingleton.getInstance();

    this.metadata = configSingleton.getMetadata();
    this.pageTemplates = configSingleton.getPageTemplates();
    this.extensionManager = new ExtensionManager(config);
    this.phpTemplate = new PhpComponentTemplate(config);
    // PHPValidator modernizado - usar método estático para validación inline
  }

  loadComponentMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.warn('⚠️ No se encontró metadata.json');
      return {};
    }
    
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error cargando metadata.json:', error.message);
      return {};
    }
  }

  extractFieldTypesFromMetadata(componentName) {
    const componentMetadata = this.metadata[componentName];
    if (!componentMetadata) return {};

    const fieldTypes = {};

    // Para componentes aggregated, extraer fieldTypes de arrayFields
    if (componentMetadata.arrayFields) {
      Object.entries(componentMetadata.arrayFields).forEach(([arrayName, fields]) => {
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

  async generateComponentCode(component, dataSource) {
    const componentName = component.name;
    const metadata = this.metadata[componentName];

    // Extraer fieldTypes del metadata.json para este componente
    const fieldTypes = this.extractFieldTypesFromMetadata(componentName);

    // Contexto para extensiones
    const context = {
      component,
      metadata,
      dataSource,
      fieldTypes,
      config: this.config
    };

    // Ejecutar hooks antes del renderizado
    await this.extensionManager.executeBeforeComponentRender(component, context);

    let result;

    // Verificar si hay un tipo de componente personalizado
    const customType = this.extensionManager.getCustomComponentType(metadata?.type);
    if (customType && customType.generateCode) {
      result = customType.generateCode(component, metadata, dataSource);
    } else if (!metadata) {
      throw new Error(`❌ METADATA MISSING: ${componentName} requiere configuración en src/metadata.json. NO usar fallbacks.`);
    } else {
      switch (metadata.type) {
        case 'static':
          result = this.generateStaticComponent(component, metadata);
          break;
        case 'iterative':
          result = this.generateIterativeComponent(component, metadata, dataSource);
          break;
        case 'aggregated':
          result = this.generateAggregatedComponent(component, metadata, dataSource);
          break;
        case 'comprehensive':
          // DEPRECATED: comprehensive ahora se maneja como aggregated
          result = this.generateAggregatedComponent(component, metadata, dataSource);
          break;
        default:
          throw new Error(`❌ Tipo de componente '${metadata.type}' no soportado. NO usar fallbacks.`);
      }
    }

    // Ejecutar hooks después del renderizado
    result = await this.extensionManager.executeAfterComponentRender(component, context, result);

    return result;
  }

  generateStaticComponent(component, metadata) {
    const props = component.props || {};
    const paramValues = metadata.parameters.map(param => {
      return props[param.name] || param.default;
    });
    
    const paramsString = paramValues.map(value => `'${value}'`).join(', ');
    
    return `<?php ${metadata.phpFunction}(${paramsString}); ?>`;
  }

  generateIterativeComponent(component, metadata, dataSource) {
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name, dataSource);
    const mapping = dataSource?.mapping || {};

    const paramMappings = metadata.parameters.map(param => {
      // Use dataSource mapping if available
      if (mapping[param.name]) {
        const mapValue = mapping[param.name];

        // Handle robust structure: { source: "meta_field", type: "acf" }
        if (typeof mapValue === 'object' && mapValue.source && mapValue.type) {
          const source = mapValue.source;
          const fieldType = mapValue.type;

          // Soporte para valores estáticos
          if (fieldType === 'static') {
            return `'${source}'`;
          }

          if (source === 'post_title') return 'get_the_title($item)';
          if (source === 'post_excerpt') return 'get_the_excerpt($item)';
          if (source === 'post_content') return 'get_the_content(null, false, $item)';
          if (source === 'post_thumbnail_url') return 'get_the_post_thumbnail_url($item, \'medium\')';
          if (source === 'post_permalink') return 'get_permalink($item)';

          if (source.startsWith('meta_')) {
            const metaKey = source.replace('meta_', '');
            if (fieldType === 'acf') {
              return `get_field('${metaKey}', $item->ID)`;
            } else {
              return `get_post_meta($item->ID, '${metaKey}', true)`;
            }
          }

          if (fieldType === 'native') {
            return `'${source}'`;
          }

          throw new Error(`❌ ITERATIVE COMPONENT ERROR: ${component.name}.${param.name} - tipo '${fieldType}' no soportado. Use: 'native', 'acf', 'static'`);
        }

        // FAIL FAST: Legacy string mappings no soportados - usar nueva estructura
        if (typeof mapValue === 'string') {
          throw new Error(`❌ ITERATIVE COMPONENT ERROR: ${component.name}.${param.name} usa mapeo legacy no soportado.

🔧 MIGRACIÓN REQUERIDA - Cambiar de:
"mapping": {
  "${param.name}": "${mapValue}"
}

✅ A estructura nueva:
"mapping": {
  "${param.name}": {
    "source": "${mapValue}",
    "type": "${mapValue.startsWith('meta_') || mapValue.startsWith('acf_') ? 'acf' : 'native'}"
  }
}

💡 UBICACIÓN: src/page-templates.json → componente "${component.name}" → dataSource.mapping
🚨 SIN BACKWARD COMPATIBILITY: Solo nueva arquitectura soportada`);
        }
      }

      // FAIL FAST: No fallbacks silenciosos - configuración explícita requerida
      throw new Error(`❌ ITERATIVE COMPONENT ERROR: ${component.name}.${param.name} no está configurado en dataSource.mapping. Configure explícitamente en page-templates.json:

📋 EJEMPLO REQUERIDO:
"dataSource": {
  "mapping": {
    "${param.name}": "post_title|post_excerpt|post_thumbnail_url|post_permalink|meta_[campo]"
  }
}

💡 UBICACIÓN: src/page-templates.json → componente "${component.name}"
🚨 SIN FALLBACKS: Configuración explícita obligatoria para calidad profesional`);
    });

    const paramsString = paramMappings.join(',\n          ');

    return `<?php
    $items = get_posts(array(${queryString}));

    if (!empty($items)) {
      foreach ($items as $item) {
        ${metadata.phpFunction}(${paramsString});
      }
    }
    ?>`;
  }

  generateAggregatedComponent(component, metadata, dataSource) {
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name, dataSource);
    // FUENTE ÚNICA DE VERDAD: Usar mapping de dataSource (page-templates.json)
    const mapping = dataSource?.mapping || {};

    // Extraer fieldTypes del metadata.json
    const fieldTypes = this.extractFieldTypesFromMetadata(component.name);

    const dataMapping = Object.entries(mapping).map(([key, value]) => {
      let mapping = '';
      
      // Manejar nueva estructura con type specification
      if (typeof value === 'object' && value.source && value.type) {
        const source = value.source;
        const fieldType = value.type;
        const defaultValue = '';
        
        if (source === 'post_title') mapping = 'get_the_title($item)';
        else if (source === 'post_excerpt') mapping = 'get_the_excerpt($item)';
        else if (source === 'post_content') mapping = 'get_the_content(null, false, $item)';
        else if (source.startsWith('meta_')) {
          const metaKey = source.replace('meta_', '');
          
          if (fieldType === 'acf') {
            // Usar fieldType del metadata.json para detección de tipo de campo
            const metadataFieldType = fieldTypes[key];

            if (metadataFieldType === 'image') {
              mapping = `(function() use ($item) {
                $field = get_field('${metaKey}', $item->ID);
                if (is_array($field) && isset($field['url'])) return $field['url'];
                if (is_numeric($field) && !empty($field)) return wp_get_attachment_image_url((int) $field, 'full') ?: '';
                if (is_string($field) && !empty($field)) return $field;
                return '${defaultValue}';
              })()`;
            } else {
              mapping = `get_field('${metaKey}', $item->ID) ?: '${defaultValue}'`;
            }
          } else {
            mapping = `get_post_meta($item->ID, '${metaKey}', true) ?: '${defaultValue}'`;
          }
        }
        else mapping = `'${source}'`;
      }
      // FAIL FAST: Estructura legacy no soportada - migrar a arquitectura unificada
      else {
        throw new Error(`❌ COMPREHENSIVE COMPONENT ERROR: ${component.name} - campo '${key}' usa estructura legacy no soportada.

🔧 MIGRACIÓN REQUERIDA - Cambiar de:
"${key}": "${value}"

✅ A estructura nueva:
"${key}": {
  "source": "${typeof value === 'string' && value.startsWith('meta_') ? value : 'post_title|post_excerpt|post_content'}",
  "type": "${typeof value === 'string' && value.startsWith('meta_') ? 'acf' : 'native'}"
}

💡 UBICACIÓN: src/page-templates.json → dataSource.wordpressData.fields
🚨 SIN BACKWARD COMPATIBILITY: Solo arquitectura unificada soportada`);
      }
      
      // CORREGIDO: Para campos ACF usar el nombre del campo real, no la clave del mapeo
      const fieldName = (typeof value === 'object' && value.source && value.source.startsWith('meta_'))
        ? value.source.replace('meta_', '')
        : key;

      return `'${fieldName}' => ${mapping}`;
    }).join(',\n          ');
    

    const props = component.props || {};
    const staticParams = metadata.parameters
      .filter(param => param.type !== 'array')
      .map(param => `'${props[param.name] || param.default}'`)
      .join(', ');
    
    return `<?php
    $items = get_posts(array(${queryString}));
    $${component.name}_data = array();
    
    if (!empty($items)) {
      foreach ($items as $item) {
        $${component.name}_data[] = array(
          ${dataMapping}
        );
      }
    }

    ${metadata.phpFunction}(${staticParams}, $${component.name}_data);
    ?>`;
  }

  generateComprehensiveComponent(component, metadata, dataSource) {
    // FUENTE ÚNICA DE VERDAD: Usar fields de dataSource (page-templates.json)
    if (!dataSource || !dataSource.fields) {
      throw new Error(`❌ COMPREHENSIVE COMPONENT ERROR: ${component.name} requiere configuración dataSource.fields en page-templates.json`);
    }

    const wordpressData = dataSource;

    // Generar código PHP dinámico usando wordpressData
    const paramValues = metadata.parameters.map(param => {
      const field = wordpressData.fields[param.name];
      const defaultValue = wordpressData.defaultValues?.[param.name];

      if (!field) {
        throw new Error(`❌ COMPREHENSIVE COMPONENT ERROR: ${component.name} - parámetro '${param.name}' no está mapeado en wordpressData.fields`);
      }

      // Generar código PHP para obtener el dato de WordPress
      let phpCode;

      if (field.type === 'native') {
        switch (field.source) {
          case 'post_title':
            phpCode = `get_the_title()`;
            break;
          case 'post_excerpt':
            phpCode = `get_the_excerpt()`;
            break;
          case 'post_content':
            phpCode = `get_the_content()`;
            break;
          case 'post_thumbnail_url':
            phpCode = `get_the_post_thumbnail_url(get_the_ID(), 'full')`;
            break;
          default:
            phpCode = `get_post_meta(get_the_ID(), '${field.source}', true)`;
        }
      } else if (field.type === 'acf') {
        // Para campos ACF, usar el nombre sin el prefijo "meta_"
        const acfFieldName = field.source.replace('meta_', '');
        phpCode = `get_field('${acfFieldName}')`;
      } else {
        throw new Error(`❌ COMPREHENSIVE COMPONENT ERROR: ${component.name} - tipo de field '${field.type}' no soportado. Use 'native' o 'acf'`);
      }

      // Agregar fallback SOLO si hay defaultValues configurados
      if (defaultValue !== undefined) {
        if (param.type === 'string') {
          return `${phpCode} ?: '${defaultValue}'`;
        } else if (param.type === 'boolean') {
          const boolDefault = defaultValue === 'true' || defaultValue === true ? 'true' : 'false';
          return `${phpCode} ?: ${boolDefault}`;
        } else if (param.type === 'array') {
          return `${phpCode} ?: array()`;
        } else {
          return `${phpCode} ?: '${defaultValue}'`;
        }
      } else {
        // Sin defaultValues: usar directamente el valor de WordPress (puede ser vacío)
        return phpCode;
      }
    });

    const paramsString = paramValues.join(', ');
    return `<?php ${metadata.phpFunction}(${paramsString}); ?>`;
  }


  buildQueryString(query, componentName, dataSource = null) {
    // 🎯 SINGLE SOURCE OF TRUTH: Usar postType desde dataSource (page-templates.json)
    if (!query.post_type && dataSource && dataSource.postType) {
      query.post_type = dataSource.postType;
    }

    return Object.entries(query)
      .map(([key, value]) => `'${key}' => ${typeof value === 'string' ? `'${value}'` : value}`)
      .join(', ');
  }

  generatePhpParameters(componentName) {
    const metadata = this.metadata[componentName];
    if (!metadata) return '';
    
    return metadata.parameters
      .map(param => {
        const phpDefault = DefaultValueParser.toPHP(param.default, param.type, 'function_param');
        return `$${param.name} = ${phpDefault}`;
      })
      .join(', ');
  }

  /**
   * Obtiene estadísticas de extensiones para debugging
   */
  getExtensionStats() {
    return this.extensionManager.getStats();
  }

  getComponentTemplate(componentName) {
    const metadata = this.metadata[componentName];
    return metadata?.template || componentName;
  }

  // Métodos para conversión de componentes Lit a PHP
  async convertAllComponents() {
    const componentsDir = path.join(this.config.srcDir, 'components');
    const components = fs.readdirSync(componentsDir);

    for (const componentName of components) {
      const componentPath = path.join(componentsDir, componentName);
      if (fs.statSync(componentPath).isDirectory()) {
        await this.convertSingleComponent(componentName, componentPath);
      }
    }
  }

  async convertSingleComponent(componentName, componentPath) {
    const litFile = path.join(componentPath, `${componentName}.js`);
    
    if (!fs.existsSync(litFile)) {
      console.warn(`⚠️ No se encontró ${litFile}`);
      return;
    }

    const litContent = fs.readFileSync(litFile, 'utf8');
    const phpComponent = this.litToPhp(componentName, litContent);
    
    const outputPath = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'components', 
      componentName,
      `${componentName}.php`
    );
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    // Validar sintaxis PHP usando método estático modernizado
    const filename = path.basename(outputPath);
    const isValidPHP = PHPValidator.validateContent(phpComponent, filename);

    // SIEMPRE escribir archivo para debug
    fs.writeFileSync(outputPath, phpComponent);

    if (!isValidPHP) {
      console.error(`❌ Error de sintaxis PHP en ${componentName}. Archivo escrito para debug.`);
      return false;
    }

    console.log(`✅ Convertido: ${componentName}`);
  }

  litToPhp(componentName, litContent) {
    const props = this.extractPropsFromLit(litContent);

    return this.phpTemplate.generate(componentName, props);
  }

  extractPropsFromLit(litContent) {
    const propMatches = litContent.match(/static properties = \{([^}]+)\}/s);
    if (!propMatches) return [];

    const propsString = propMatches[1];
    const props = [];
    
    // Buscar propiedades con type definido
    const propRegex = /(\w+):\s*\{\s*type:\s*(\w+)/g;
    let match;
    
    while ((match = propRegex.exec(propsString)) !== null) {
      props.push({
        name: match[1],
        type: match[2].toLowerCase()
      });
    }
    
    // Si no se encontraron propiedades con type, buscar propiedades simples
    if (props.length === 0) {
      const simplePropRegex = /(\w+):\s*\{/g;
      while ((match = simplePropRegex.exec(propsString)) !== null) {
        props.push({
          name: match[1],
          type: 'string'
        });
      }
    }
    
    return props;
  }

  extractCssClasses(litContent) {
    const cssMatches = litContent.match(/css`([^`]+)`/s);
    if (!cssMatches) return '';
    
    const rawCss = cssMatches[1];
    return this.cleanCssForWordPress(rawCss);
  }

  cleanCssForWordPress(css) {
    let cleanedCss = css;
    
    // Remover :host selector y su contenido (es específico de Web Components)
    cleanedCss = cleanedCss.replace(/:host\s*\{[^}]*\}/g, '');
    
    // Normalizar llaves - asegurar que cada selector tenga su llave de apertura
    cleanedCss = cleanedCss.replace(/([^{}]+)\s*\{/g, '$1 {');
    
    // Asegurar que todas las propiedades CSS terminen con ; y tengan }
    const cssRules = [];
    const lines = cleanedCss.split('\n');
    let currentRule = '';
    let insideRule = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.includes('{')) {
        // Inicio de regla CSS
        currentRule = line;
        insideRule = true;
        braceCount++;
      } else if (line.includes('}')) {
        // Fin de regla CSS
        if (currentRule && insideRule) {
          currentRule += '\n  }';
          cssRules.push(currentRule);
          currentRule = '';
          insideRule = false;
          braceCount--;
        }
      } else if (insideRule) {
        // Propiedad CSS dentro de una regla
        let property = line;
        if (!property.endsWith(';') && property.includes(':')) {
          property += ';';
        }
        currentRule += '\n  ' + property;
      } else if (line.match(/^\.\w+[-\w]*/) && !line.includes('{')) {
        // Selector sin llave de apertura - agregar llave
        currentRule = line + ' {';
        insideRule = true;
        braceCount++;
      }
    }
    
    // Si quedó una regla abierta, cerrarla
    if (currentRule && insideRule) {
      currentRule += '\n}';
      cssRules.push(currentRule);
    }
    
    cleanedCss = cssRules.join('\n\n');
    
    // Limpiar espacios múltiples y líneas vacías
    cleanedCss = cleanedCss.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanedCss = cleanedCss.trim();
    
    return cleanedCss;
  }
}

module.exports = ComponentGenerator;
