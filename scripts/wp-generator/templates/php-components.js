const fs = require('fs');
const path = require('path');

class PhpComponentTemplate {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadMetadata();
  }

  loadMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return {};
  }

  generate(componentName, props, cssClasses, fieldTypes = {}) {
    this.currentComponentName = componentName; // Trackear componente actual
    const functionName = `render_${componentName.replace('-', '_')}`;
    
    // Usar metadata para generar parámetros
    const propsParams = this.generatePhpParameters(componentName) || 
      (props || []).map(prop => `$${prop.name} = ''`).join(', ');
    
    return `<?php
/**
 * ${componentName} Component
 * Auto-generated from Lit component
 */

function ${functionName}(${propsParams}) {
    ?>
    ${this.generatePhpTemplate(componentName, props, fieldTypes)}

    <?php
}

// Hook para registrar estilos en wp_head (mejor práctica)
add_action('wp_head', function() {
    static $${componentName.replace('-', '_')}_styles_loaded = false;
    if (!$${componentName.replace('-', '_')}_styles_loaded) {
        echo '<style id="${componentName}-component-styles">';
        echo '${cssClasses.replace(/\n/g, '').replace(/'/g, "\\'")}';
        echo '</style>';
        $${componentName.replace('-', '_')}_styles_loaded = true;
    }
});
?>`;
  }

  generatePhpTemplate(componentName, props, fieldTypes = {}) {
    // FAIL FAST: Solo generar desde componente Lit - sin fallbacks
    const dynamicTemplate = this.generateTemplateFromLitComponent(componentName, fieldTypes);
    if (!dynamicTemplate) {
      throw new Error(`❌ PHP TEMPLATE ERROR: No se pudo generar template para '${componentName}'

🔧 SOLUCIONES:
1. Verificar que existe src/components/${componentName}/${componentName}.js
2. Verificar que el componente Lit tiene método render() válido
3. Verificar que el template HTML está bien formado

💡 UBICACIÓN: src/components/${componentName}/${componentName}.js
🚨 SIN FALLBACKS: Solo generación dinámica desde Lit soportada`);
    }

    return dynamicTemplate;
  }

  generatePhpParameters(componentName) {
    const metadata = this.metadata[componentName];
    if (!metadata) {
      throw new Error(`❌ PHP PARAMETERS ERROR: No metadata para componente '${componentName}'

🔧 SOLUCIÓN:
Verificar que existe configuración en src/metadata.json para componente '${componentName}'

💡 UBICACIÓN: src/metadata.json
🚨 SIN FALLBACKS: Solo metadata explícita soportada`);
    }

    if (!metadata.parameters) {
      throw new Error(`❌ PHP PARAMETERS ERROR: Componente '${componentName}' no tiene parameters definidos

🔧 SOLUCIÓN:
Agregar section 'parameters' en metadata.json para componente '${componentName}'

💡 UBICACIÓN: src/metadata.json → "${componentName}" → "parameters"
🚨 SIN FALLBACKS: Solo parameters explícitos soportados`);
    }

    return metadata.parameters
      .map(param => `$${param.name} = '${param.default}'`)
      .join(', ');
  }

  /**
   * Genera template PHP dinámicamente desde el componente Lit
   */
  generateTemplateFromLitComponent(componentName, fieldTypes = {}) {
    const componentPath = path.join(this.config.srcDir, 'components', componentName, `${componentName}.js`);
    
    if (!fs.existsSync(componentPath)) {
      return null;
    }
    
    try {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      const htmlTemplate = this.extractHtmlTemplate(componentContent);
      
      if (htmlTemplate) {
        return this.convertLitTemplateToPhp(htmlTemplate, componentName, fieldTypes);
      }
    } catch (error) {
      console.warn(`No se pudo procesar dinámicamente ${componentName}: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Extrae el template HTML del método render() del componente Lit
   */
  extractHtmlTemplate(componentContent) {
    // Buscar el método render() y extraer el template html`...`
    const renderMatch = componentContent.match(/render\(\)\s*\{[\s\S]*?return\s+html`([\s\S]*?)`;[\s\S]*?\}/);
    
    if (renderMatch && renderMatch[1]) {
      return renderMatch[1].trim();
    }
    
    return null;
  }

  /**
   * Convierte un template Lit a PHP
   */
  convertLitTemplateToPhp(litTemplate, componentName, fieldTypes = {}) {
    let phpTemplate = litTemplate;
    
    // Manejar arrays con map() - soportar parámetros múltiples (img, index)
    phpTemplate = phpTemplate.replace(/\$\{this\.(\w+)\.map\(\(([^,)]+)(?:,\s*(\w+))?\)\s*=>\s*html`([\s\S]*?)`\)\}/g, 
      (match, arrayProp, itemVar, indexVar, itemTemplate) => {
        let phpItemTemplate = this.convertArrayItemTemplate(itemTemplate, arrayProp, itemVar, indexVar, fieldTypes);
        return `<?php if (!empty($${arrayProp})): ?><?php foreach ($${arrayProp} as ${indexVar ? '$index => ' : ''}$item): ?>${phpItemTemplate}<?php endforeach; ?><?php else: ?><p><?php _e('No hay elementos disponibles.', '${this.config.themeName || "theme"}'); ?></p><?php endif; ?>`;
      });
    
    // Fallback para patrón simple sin paréntesis
    phpTemplate = phpTemplate.replace(/\$\{this\.(\w+)\.map\(\w+ => html`([\s\S]*?)`\)\}/g, 
      (match, arrayProp, itemTemplate) => {
        let phpItemTemplate = this.convertArrayItemTemplate(itemTemplate, arrayProp, null, null, fieldTypes);
        return `<?php if (!empty($${arrayProp})): ?><?php foreach ($${arrayProp} as $item): ?>${phpItemTemplate}<?php endforeach; ?><?php else: ?><p><?php _e('No hay elementos disponibles.', '${this.config.themeName || "theme"}'); ?></p><?php endif; ?>`;
      });
    
    // Manejar llamadas a métodos de la clase - convertir a PHP inline 
    phpTemplate = phpTemplate.replace(/\$\{this\.(\w+)\(([^)]+)\)\}/g, (match, methodName, params) => {
      // Analizar el método específico del componente Lit original
      const methodCode = this.extractMethodFromLitComponent(methodName);
      if (methodCode) {
        return this.convertMethodToPhp(methodName, params, methodCode);
      }
      // Fallback: comentario indicando que se necesita implementación manual
      return `<?php /* TODO: Implementar método ${methodName}(${params}) */ ?>`;
    });
    
    // Manejar bloques condicionales complejos con templates anidados
    phpTemplate = phpTemplate.replace(/\$\{this\.(\w+) \? html`([\s\S]*?)` : (['"][^'"]*['"]|''|`[\s\S]*?`)\}/g, 
      (match, condition, trueBranch, falseBranch) => {
        let phpTrue = this.convertSimpleInterpolations(trueBranch, null, fieldTypes);
        let phpFalse = falseBranch === "''" || falseBranch === '""' ? '' : falseBranch;
        const phpCondition = this.convertPropName(condition);
        return `<?php if ($${phpCondition}): ?>${phpTrue}<?php else: ?>${phpFalse}<?php endif; ?>`;
      });
    
    // Manejar bloques condicionales con templates anidados (caso específico)
    phpTemplate = phpTemplate.replace(/\$\{this\.(\w+) \? html`([\s\S]*?)` : html`([\s\S]*?)`\}/g, 
      (match, condition, trueBranch, falseBranch) => {
        let phpTrue = this.convertSimpleInterpolations(trueBranch, null, fieldTypes);
        let phpFalse = this.convertSimpleInterpolations(falseBranch, null, fieldTypes);
        return `<?php if ($${condition}): ?>${phpTrue}<?php else: ?>${phpFalse}<?php endif; ?>`;
      });
    
    // Luego convertir interpolaciones simples restantes
    phpTemplate = this.convertSimpleInterpolations(phpTemplate, null, fieldTypes);
    
    // Agregar lazy loading basado en metadata del componente
    const componentMetadata = this.metadata[componentName];
    if (componentMetadata?.performance?.lazyLoading) {
      phpTemplate = phpTemplate.replace(/<img([^>]*?)(?!\s+loading=)/g, '<img$1 loading="lazy"');
    }
    
    return phpTemplate;
  }
  
  /**
   * Convierte template de item de array
   */
  convertArrayItemTemplate(itemTemplate, arrayProp, itemVar = null, indexVar = null, fieldTypes = {}) {
    // Para feature-grid, convertir ${feature.property} a <?php echo $item['property']; ?>
    let phpTemplate = itemTemplate;
    
    // Determinar el nombre de la variable del item
    if (!itemVar) {
      itemVar = arrayProp === 'features' ? 'feature' : arrayProp.slice(0, -1); // quitar 's' del plural
    }
    
    // Manejar condicionales complejos con templates anidados de forma genérica
    // Patrón: ${item.prop ? html`...` : html`...`}
    phpTemplate = phpTemplate.replace(
      new RegExp(`\\$\\{${itemVar}\\.(\\w+) \\? html\`([\\s\\S]*?)\` : html\`([\\s\\S]*?)\`\\}`, 'g'),
      (match, propName, trueBranch, falseBranch) => {
        const phpTrue = this.convertSimpleInterpolations(trueBranch, itemVar, fieldTypes);
        const phpFalse = this.convertSimpleInterpolations(falseBranch, itemVar, fieldTypes);
        return `<?php if (!empty($item['${propName}'])): ?>${phpTrue}<?php else: ?>${phpFalse}<?php endif; ?>`;
      }
    );
    
    // Patrón: ${item.prop ? html`...` : ''}
    phpTemplate = phpTemplate.replace(
      new RegExp(`\\$\\{${itemVar}\\.(\\w+) \\? html\`([\\s\\S]*?)\` : ['"]['"]\\}`, 'g'),
      (match, propName, trueBranch) => {
        const phpTrue = this.convertSimpleInterpolations(trueBranch, itemVar, fieldTypes);
        return `<?php if (!empty($item['${propName}'])): ?>${phpTrue}<?php endif; ?>`;
      }
    );
    
    phpTemplate = phpTemplate.replace(new RegExp(`\\$\\{${itemVar}\\.(\\w+)([^}]*)\\}`, 'g'), 
      (fullMatch, prop, rest) => {
        if (rest && rest.includes('||')) {
          // Manejar casos como ${feature.icon || '✨'}
          const defaultValue = rest.match(/\|\|\s*['"]([^'"]*)['"]/);
          const fallback = defaultValue ? defaultValue[1] : '';
          return `<?php echo !empty($item['${prop}']) ? esc_html($item['${prop}']) : '${fallback}'; ?>`;
        }
        return `<?php echo esc_html($item['${prop}']); ?>`;
      });
    
    return phpTemplate;
  }
  
  /**
   * Convierte interpolaciones simples ${this.prop} o ${item.prop}
   */
  convertSimpleInterpolations(template, itemVar = null, fieldTypes = {}) {
    if (itemVar) {
      // Convertir ${item.prop} a <?php echo $item['prop']; ?>
      return template.replace(new RegExp(`\\$\\{${itemVar}\\.(\\w+)(?:\\.(\\w+)\\(\\))?\\}`, 'g'), (match, prop, method) => {
        if (method) {
          // Manejar métodos como charAt(0).toUpperCase()
          if (method === 'charAt' && match.includes('toUpperCase')) {
            return `<?php echo esc_html(strtoupper(substr($item['${prop}'], 0, 1))); ?>`;
          }
        }

        // CORREGIDO: Solo usar fieldType explícito, sin detección por nombres
        const fieldType = fieldTypes[prop];
        if (fieldType === 'image') {
          return `<?php
            if (!empty($item['${prop}'])) {
              if (is_numeric($item['${prop}'])) {
                echo esc_url(wp_get_attachment_image_url((int) $item['${prop}'], 'full') ?: '');
              } elseif (filter_var($item['${prop}'], FILTER_VALIDATE_URL)) {
                echo esc_url($item['${prop}']);
              }
            }
          ?>`;
        } else {
          // Usar esc_html por defecto para todo el contenido
          return `<?php echo esc_html($item['${prop}']); ?>`;
        }
      });
    }
    
    // Convertir ${this.prop} a <?php echo $prop; ?>
    return template.replace(/\$\{this\.(\w+)\}/g, (match, prop) => {
      // Convertir camelCase a snake_case para PHP
      const phpProp = prop.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      // Determinar el tipo de escape apropiado
      if (phpProp === 'link' || phpProp.includes('url') || phpProp.includes('image')) {
        return `<?php echo esc_url($${phpProp}); ?>`;
      } else if (phpProp.includes('alt') || phpProp === 'title') {
        return `<?php echo esc_attr($${phpProp}); ?>`;
      } else {
        return `<?php echo esc_html($${phpProp}); ?>`;
      }
    });
  }

  /**
   * Extrae método específico del componente Lit
   */
  extractMethodFromLitComponent(methodName) {
    const componentPath = path.join(this.config.srcDir, 'components', this.currentComponentName, `${this.currentComponentName}.js`);
    
    if (!fs.existsSync(componentPath)) {
      return null;
    }
    
    try {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      const methodRegex = new RegExp(`${methodName}\\([^{]*\\)\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, 'g');
      const match = methodRegex.exec(componentContent);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch (error) {
      console.warn(`No se pudo extraer método ${methodName}: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Convierte método JavaScript a PHP
   */
  convertMethodToPhp(methodName, params, methodCode) {
    // Para renderStars específicamente
    if (methodName === 'renderStars' && methodCode.includes('for (let i = 1; i <= 5; i++)')) {
      const paramName = params.split('.').pop(); // Obtener 'rating' de 'testimonial.rating'
      return `<?php for ($i = 1; $i <= 5; $i++): ?>
                        <span class="star"><?php echo $i <= $item['${paramName}'] ? '★' : '☆'; ?></span>
                    <?php endfor; ?>`;
    }
    
    // Otros métodos pueden agregarse aquí de forma genérica
    return `<?php /* Método ${methodName} necesita conversión manual */ ?>`;
  }
  
  /**
   * Convierte nombres de propiedades de camelCase a snake_case
   */
  convertPropName(camelCaseName) {
    return camelCaseName.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  /**
   * Genera conversiones de parámetros JSON para componentes que los necesiten
   */
  generateParamConversions(componentName) {
    const metadata = this.metadata[componentName];
    if (!metadata || !metadata.parameters) return '';
    
    const jsonParams = metadata.parameters.filter(param => 
      param.type === 'array' || param.type === 'object' || param.name.includes('Data') || param.name.includes('Images')
    );
    
    if (jsonParams.length === 0) return '';
    
    const conversions = jsonParams.map(param => 
      `// Convertir parámetros JSON a arrays PHP
    if (is_string($${param.name})) {
        $${param.name} = json_decode($${param.name}, true) ?: ${param.type === 'array' ? '[]' : '{}'};
    }`
    ).join('\n    ');
    
    return conversions;
  }

  /**
   * Extrae propiedades del componente Lit
   */
  extractLitProperties(componentName) {
    const componentPath = path.join(this.config.srcDir, 'components', componentName, `${componentName}.js`);
    
    if (!fs.existsSync(componentPath)) {
      return [];
    }
    
    try {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Buscar static properties = {...}
      const propsMatch = componentContent.match(/static\s+properties\s*=\s*\{([\s\S]*?)\};/);
      if (!propsMatch) return [];
      
      const propsContent = propsMatch[1];
      const properties = [];
      
      // Extraer cada propiedad
      const propMatches = propsContent.matchAll(/(\w+):\s*\{[^}]*\}/g);
      for (const propMatch of propMatches) {
        properties.push({ name: propMatch[1], default: '' });
      }
      
      // También buscar valores por defecto en el constructor
      const constructorMatch = componentContent.match(/constructor\(\)\s*\{[\s\S]*?\}/);
      if (constructorMatch) {
        const constructorContent = constructorMatch[0];
        properties.forEach(prop => {
          const defaultMatch = constructorContent.match(new RegExp(`this\.${prop.name}\s*=\s*['"](.*?)['"];`));
          if (defaultMatch) {
            prop.default = defaultMatch[1];
          }
        });
      }
      
      return properties;
      
    } catch (error) {
      console.warn(`No se pudieron extraer propiedades de ${componentName}: ${error.message}`);
      return [];
    }
  }
}

module.exports = PhpComponentTemplate;