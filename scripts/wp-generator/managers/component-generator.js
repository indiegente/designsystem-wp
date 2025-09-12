const fs = require('fs');
const path = require('path');
const ExtensionManager = require('../extensions/extension-manager');
const PhpComponentTemplate = require('../templates/php-components');
const PHPValidator = require('../validation/php-validator');

class ComponentGenerator {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadComponentMetadata();
    this.extensionManager = new ExtensionManager(config);
    this.phpTemplate = new PhpComponentTemplate(config);
    this.phpValidator = new PHPValidator(config);
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

  async generateComponentCode(component, dataSource) {
    const componentName = component.name;
    const metadata = this.metadata[componentName];
    
    // Contexto para extensiones
    const context = {
      component,
      metadata,
      dataSource,
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
      console.warn(`⚠️ No se encontró metadata para el componente: ${componentName}`);
      result = this.generateFallbackCode(component, dataSource);
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
          result = this.generateComprehensiveComponent(component, metadata, dataSource);
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
    const queryString = this.buildQueryString(query, component.name);
    
    const paramMappings = metadata.parameters.map(param => {
      if (param.name === 'title') return 'get_the_title()';
      if (param.name === 'description') return 'get_the_excerpt()';
      if (param.name === 'image') return 'get_the_post_thumbnail_url(get_the_ID(), \'medium\')';
      if (param.name === 'link') return 'get_permalink()';
      if (param.name === 'link_text') return `'${param.default}'`;
      return `'${param.default}'`;
    });
    
    const paramsString = paramMappings.join(',\n          ');
    
    return `<?php
    $items = get_posts(array(${queryString}));
    
    if (!empty($items)) {
      foreach ($items as $item) {
        setup_postdata($item);
        ${metadata.phpFunction}(${paramsString});
      }
      wp_reset_postdata();
    }
    ?>`;
  }

  generateAggregatedComponent(component, metadata, dataSource) {
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name);
    const aggregation = metadata.aggregation;
    
    const dataStructure = aggregation.dataStructure;
    const defaultValues = aggregation.defaultValues || {};
    
    const dataMapping = Object.entries(dataStructure).map(([key, value]) => {
      let mapping = '';
      
      // Manejar nueva estructura con type specification
      if (typeof value === 'object' && value.source && value.type) {
        const source = value.source;
        const fieldType = value.type;
        const defaultValue = defaultValues[key] || '';
        
        if (source === 'post_title') mapping = 'get_the_title()';
        else if (source === 'post_excerpt') mapping = 'get_the_excerpt()';
        else if (source === 'post_content') mapping = 'get_the_content()';
        else if (source.startsWith('meta_')) {
          const metaKey = source.replace('meta_', '');
          
          if (fieldType === 'acf') {
            mapping = `get_field('${metaKey}') ?: '${defaultValue}'`;
          } else {
            mapping = `get_post_meta(get_the_ID(), '${metaKey}', true) ?: '${defaultValue}'`;
          }
        }
        else mapping = `'${source}'`;
      }
      // Backward compatibility - estructura anterior
      else if (typeof value === 'string') {
        if (value === 'post_title') mapping = 'get_the_title()';
        else if (value === 'post_excerpt') mapping = 'get_the_excerpt()';
        else if (value === 'post_content') mapping = 'get_the_content()';
        else if (value.startsWith('meta_')) {
          const metaKey = value.replace('meta_', '');
          const defaultValue = defaultValues[key] || '';
          
          // Check fieldTypes for ACF vs native
          const fieldTypes = metadata.fieldTypes || {};
          if (fieldTypes[key] === 'acf') {
            mapping = `get_field('${metaKey}') ?: '${defaultValue}'`;
          } else {
            mapping = `get_post_meta(get_the_ID(), '${metaKey}', true) ?: '${defaultValue}'`;
          }
        }
        else mapping = `'${value}'`;
      }
      
      return `'${key}' => ${mapping}`;
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
        setup_postdata($item);
        $${component.name}_data[] = array(
          ${dataMapping}
        );
      }
      wp_reset_postdata();
    }
    
    ${metadata.phpFunction}(${staticParams}, $${component.name}_data);
    ?>`;
  }

  generateComprehensiveComponent(component, metadata, dataSource) {
    // Para componentes comprehensive, usar datos reales de component.props
    const props = component.props || {};
    
    const paramValues = metadata.parameters.map(param => {
      const value = props[param.name] || param.default;
      
      if (param.type === 'array' && param.name === 'testImages') {
        // Convertir array JavaScript a PHP array
        if (Array.isArray(value)) {
          const phpArrayItems = value.map(item => 
            `array('src' => '${item.src}', 'alt' => '${item.alt}')`
          ).join(', ');
          return `array(${phpArrayItems})`;
        }
        return 'array()';
      } else if (param.type === 'object' && param.name === 'testData') {
        // Convertir object JavaScript a PHP array
        if (typeof value === 'object' && value !== null) {
          const phpObjectItems = [];
          for (const [key, val] of Object.entries(value)) {
            if (Array.isArray(val)) {
              const phpArray = val.map(v => `'${v}'`).join(', ');
              phpObjectItems.push(`'${key}' => array(${phpArray})`);
            } else if (typeof val === 'object') {
              const phpSubObject = Object.entries(val).map(([k, v]) => 
                `'${k}' => '${v}'`
              ).join(', ');
              phpObjectItems.push(`'${key}' => array(${phpSubObject})`);
            } else {
              phpObjectItems.push(`'${key}' => '${val}'`);
            }
          }
          return `array(${phpObjectItems.join(', ')})`;
        }
        return 'array()';
      } else if (param.type === 'boolean') {
        return value === 'true' || value === true ? 'true' : 'false';
      } else {
        return `'${value}'`;
      }
    });
    
    const paramsString = paramValues.join(', ');
    
    return `<?php ${metadata.phpFunction}(${paramsString}); ?>`;
  }

  generateFallbackCode(component, dataSource) {
    const componentName = component.name.replace('-', '_');
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name);
    
    return `
    // Código fallback para ${componentName}
    $items = get_posts(array(${queryString}));
    
    if (!empty($items)) {
      foreach ($items as $item) {
        setup_postdata($item);
        // render_${componentName}() - implementar según necesidad
      }
      wp_reset_postdata();
    }`;
  }

  buildQueryString(query, componentName) {
    // Asegurar post_type basado en el mapeo de metadata
    if (!query.post_type && this.metadata.componentMapping) {
      const mappedPostType = this.metadata.componentMapping[componentName];
      if (mappedPostType) {
        query.post_type = mappedPostType;
      }
    }
    
    return Object.entries(query)
      .map(([key, value]) => `'${key}' => ${typeof value === 'string' ? `'${value}'` : value}`)
      .join(', ');
  }

  generatePhpParameters(componentName) {
    const metadata = this.metadata[componentName];
    if (!metadata) return '';
    
    return metadata.parameters
      .map(param => `$${param.name} = '${param.default}'`)
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
    
    // Validar sintaxis PHP antes de escribir
    const filename = path.basename(outputPath);
    if (!this.phpValidator.validatePHPContent(phpComponent, filename)) {
      console.error(`❌ Error de sintaxis PHP en ${componentName}. No se escribió el archivo.`);
      return false;
    }
    
    fs.writeFileSync(outputPath, phpComponent);
    console.log(`✅ Convertido: ${componentName}`);
  }

  litToPhp(componentName, litContent) {
    const props = this.extractPropsFromLit(litContent);
    const cssClasses = this.extractCssClasses(litContent);
    
    return this.phpTemplate.generate(componentName, props, cssClasses);
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
