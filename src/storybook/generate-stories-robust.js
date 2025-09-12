#!/usr/bin/env node

/**
 * Generador Robusto de Stories - Versión Mejorada
 * 
 * Esta versión maneja casos edge y patrones complejos que pueden
 * romper la generación automática de stories.
 */

const fs = require('fs');
const path = require('path');

class RobustStoryGenerator {
  constructor() {
    this.componentsDir = path.join(process.cwd(), 'src', 'components');
    this.metadata = this.loadMetadata();
    this.errors = [];
    this.warnings = [];
  }

  loadMetadata() {
    try {
      const metadataPath = path.join(process.cwd(), 'src', 'component-metadata.json');
      if (fs.existsSync(metadataPath)) {
        const content = fs.readFileSync(metadataPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      this.addError('metadata', `Error cargando metadata: ${error.message}`);
    }
    return {};
  }

  findComponentsWithoutStories() {
    const components = [];
    
    try {
      const dirs = fs.readdirSync(this.componentsDir);
      
      for (const componentName of dirs) {
        const componentPath = path.join(this.componentsDir, componentName);
        
        // Verificar que sea directorio
        if (!this.isDirectory(componentPath)) continue;
        
        const componentFile = path.join(componentPath, `${componentName}.js`);
        const storiesFile = path.join(componentPath, `${componentName}.stories.js`);
        
        if (fs.existsSync(componentFile) && !fs.existsSync(storiesFile)) {
          components.push(componentName);
        }
      }
    } catch (error) {
      this.addError('discovery', `Error buscando componentes: ${error.message}`);
    }
    
    return components;
  }

  isDirectory(path) {
    try {
      return fs.statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  analyzeComponent(componentName) {
    const componentPath = path.join(this.componentsDir, componentName, `${componentName}.js`);
    
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Validar que el archivo sea válido JavaScript
      this.validateJavaScript(content, componentName);
      
      // Extraer información del componente
      const properties = this.extractPropertiesRobust(content, componentName);
      const metadata = this.metadata[componentName];
      const className = this.extractClassNameRobust(content, componentName);
      const tagName = this.extractTagNameRobust(content, componentName);
      
      // Validaciones adicionales
      this.validateComponentInfo(componentName, className, tagName, properties);
      
      return {
        name: componentName,
        properties,
        metadata,
        className,
        tagName,
        isValid: this.errors.filter(e => e.component === componentName).length === 0
      };
      
    } catch (error) {
      this.addError(componentName, `Error analizando componente: ${error.message}`);
      return null;
    }
  }

  validateJavaScript(content, componentName) {
    // Verificar sintaxis básica
    const commonErrors = [
      { pattern: /static properties = \{[^}]*\{[^}]*\}[^}]*,\s*[^}]*\{/g, error: 'Missing comma in properties' },
      { pattern: /static properties = \{[^}]*[^,]\s*\}/g, error: 'Missing comma before closing brace' },
      { pattern: /export class \w+ extends LitElement \{[^}]*static properties[^=]*=\s*\{[^}]*$/g, error: 'Unclosed properties object' }
    ];
    
    commonErrors.forEach(({ pattern, error }) => {
      if (pattern.test(content)) {
        this.addWarning(componentName, `Posible error de sintaxis: ${error}`);
      }
    });
    
    // Verificar que tenga imports necesarios
    if (!content.includes('LitElement')) {
      this.addError(componentName, 'No importa LitElement');
    }
    
    if (!content.includes('export class')) {
      this.addError(componentName, 'No exporta una clase');
    }
  }

  extractPropertiesRobust(content, componentName) {
    const properties = {};
    
    try {
      // Método 1: static properties = {...}
      const staticPropsMatch = content.match(/static\s+properties\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/s);
      if (staticPropsMatch) {
        return this.parsePropertiesObject(staticPropsMatch[1], componentName);
      }
      
      // Método 2: static get properties() {...}
      const getterMatch = content.match(/static\s+get\s+properties\(\)\s*\{[^}]*return\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/s);
      if (getterMatch) {
        this.addWarning(componentName, 'Usa getter pattern para properties - convierte a static properties');
        return this.parsePropertiesObject(getterMatch[1], componentName);
      }
      
      // Método 3: Buscar en herencia/mixins
      const superPropsMatch = content.match(/\.\.\.super\.properties,\s*([^}]*)/s);
      if (superPropsMatch) {
        this.addWarning(componentName, 'Usa herencia de properties - solo se analizarán properties propias');
        return this.parsePropertiesObject(superPropsMatch[1], componentName);
      }
      
    } catch (error) {
      this.addError(componentName, `Error extrayendo properties: ${error.message}`);
    }
    
    // Si no encuentra properties, buscar valores por defecto en constructor
    return this.extractConstructorDefaults(content, componentName);
  }

  parsePropertiesObject(propertiesString, componentName) {
    const properties = {};
    
    try {
      // Limpiar comentarios
      const cleanString = this.removeComments(propertiesString);
      
      // Extraer propiedades individuales con regex mejorado
      const propertyRegex = /(['"']?[\w\-]+['"]?)\s*:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
      let match;
      
      while ((match = propertyRegex.exec(cleanString)) !== null) {
        const [, rawPropName, propConfig] = match;
        
        // Limpiar nombre de propiedad
        const propName = this.cleanPropertyName(rawPropName, componentName);
        if (!propName) continue;
        
        // Parsear configuración de la propiedad
        const propInfo = this.parsePropertyConfig(propConfig, propName, componentName);
        if (propInfo) {
          properties[propName] = propInfo;
        }
      }
      
      // Fallback: buscar propiedades simples sin configuración
      if (Object.keys(properties).length === 0) {
        const simpleRegex = /(['"']?[\w\-]+['"]?)\s*:\s*\{\s*\}/g;
        while ((match = simpleRegex.exec(cleanString)) !== null) {
          const propName = this.cleanPropertyName(match[1], componentName);
          if (propName) {
            properties[propName] = { type: 'String', control: 'text' };
            this.addWarning(componentName, `Property ${propName} sin type definido, asumiendo String`);
          }
        }
      }
      
    } catch (error) {
      this.addError(componentName, `Error parseando properties: ${error.message}`);
    }
    
    return properties;
  }

  removeComments(str) {
    // Remover comentarios de línea y bloque
    return str
      .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios de bloque
      .replace(/\/\/.*$/gm, '');        // Comentarios de línea
  }

  cleanPropertyName(rawName, componentName) {
    // Remover comillas
    let name = rawName.replace(/['"]/g, '').trim();
    
    // Validar nombre
    if (!name) {
      this.addWarning(componentName, 'Property con nombre vacío ignorada');
      return null;
    }
    
    // Advertir sobre nombres problemáticos
    const problematicNames = ['constructor', 'prototype', 'className', '__proto__'];
    if (problematicNames.includes(name)) {
      this.addWarning(componentName, `Property '${name}' es una palabra reservada`);
    }
    
    if (name.startsWith('__')) {
      this.addWarning(componentName, `Property '${name}' parece privada`);
    }
    
    if (/^\d/.test(name)) {
      this.addWarning(componentName, `Property '${name}' empieza con número`);
    }
    
    if (name.includes('-') && !name.startsWith('data-')) {
      this.addWarning(componentName, `Property '${name}' contiene guiones`);
    }
    
    return name;
  }

  parsePropertyConfig(configString, propName, componentName) {
    const config = { type: 'String', control: 'text' };
    
    try {
      // Buscar type
      const typeMatch = configString.match(/type\s*:\s*(\w+)/);
      if (typeMatch) {
        const rawType = typeMatch[1];
        config.type = this.normalizeType(rawType, propName, componentName);
        config.control = this.getControlType(config.type);
      } else {
        this.addWarning(componentName, `Property '${propName}' sin type definido`);
      }
      
      // Detectar state properties (no deberían ir en stories)
      if (configString.includes('state:') && configString.includes('true')) {
        this.addWarning(componentName, `Property '${propName}' es state - podría no ser apropiada para stories`);
        return null; // No incluir state properties
      }
      
      // Detectar noAccessor
      if (configString.includes('noAccessor:') && configString.includes('true')) {
        this.addWarning(componentName, `Property '${propName}' tiene noAccessor - verificar si es apropiada para stories`);
      }
      
      // Detectar converters personalizados
      if (configString.includes('converter:')) {
        this.addWarning(componentName, `Property '${propName}' tiene converter personalizado`);
      }
      
    } catch (error) {
      this.addError(componentName, `Error parseando config de property '${propName}': ${error.message}`);
    }
    
    return config;
  }

  normalizeType(rawType, propName, componentName) {
    const typeMap = {
      'String': 'String',
      'Number': 'Number',
      'Boolean': 'Boolean',
      'Array': 'Array',
      'Object': 'Object',
      'Function': 'Function',
      'Date': 'Date'
    };
    
    if (typeMap[rawType]) {
      return typeMap[rawType];
    }
    
    // Types problemáticos
    const problematicTypes = ['Function', 'WeakMap', 'WeakSet', 'Symbol', 'BigInt'];
    if (problematicTypes.includes(rawType)) {
      this.addWarning(componentName, `Property '${propName}' usa type problemático '${rawType}'`);
      return 'Object'; // Fallback seguro
    }
    
    // Types de terceros
    if (!['String', 'Number', 'Boolean', 'Array', 'Object'].includes(rawType)) {
      this.addWarning(componentName, `Property '${propName}' usa type no estándar '${rawType}' - tratado como Object`);
      return 'Object';
    }
    
    return rawType;
  }

  extractConstructorDefaults(content, componentName) {
    const properties = {};
    
    try {
      const constructorMatch = content.match(/constructor\(\)\s*\{([^}]*)\}/s);
      if (!constructorMatch) return properties;
      
      const constructorBody = constructorMatch[1];
      const assignmentRegex = /this\.(\w+)\s*=\s*([^;]+);/g;
      let match;
      
      while ((match = assignmentRegex.exec(constructorBody)) !== null) {
        const [, propName, value] = match;
        
        // Ignorar propiedades privadas
        if (propName.startsWith('_')) continue;
        
        const type = this.inferTypeFromValue(value.trim());
        properties[propName] = {
          type,
          control: this.getControlType(type),
          detectedIn: 'constructor'
        };
        
        this.addWarning(componentName, `Property '${propName}' detectada solo en constructor`);
      }
      
    } catch (error) {
      this.addError(componentName, `Error extrayendo defaults del constructor: ${error.message}`);
    }
    
    return properties;
  }

  inferTypeFromValue(value) {
    // Remover espacios y comillas
    value = value.trim();
    
    if (value === 'true' || value === 'false') return 'Boolean';
    if (/^\d+$/.test(value)) return 'Number';
    if (/^\d+\.\d+$/.test(value)) return 'Number';
    if (value.startsWith('[') && value.endsWith(']')) return 'Array';
    if (value.startsWith('{') && value.endsWith('}')) return 'Object';
    if (value.startsWith("'") || value.startsWith('"')) return 'String';
    
    return 'String'; // Default fallback
  }

  extractClassNameRobust(content, componentName) {
    try {
      // Buscar export class
      const exportMatch = content.match(/export\s+class\s+(\w+)/);
      if (exportMatch) {
        return exportMatch[1];
      }
      
      // Buscar class sin export
      const classMatch = content.match(/class\s+(\w+)\s+extends/);
      if (classMatch) {
        this.addWarning(componentName, `Clase '${classMatch[1]}' no está exportada`);
        return classMatch[1];
      }
      
      // Fallback: generar desde nombre del componente
      this.addWarning(componentName, 'No se encontró nombre de clase, generando desde nombre del archivo');
      return this.toPascalCase(componentName);
      
    } catch (error) {
      this.addError(componentName, `Error extrayendo nombre de clase: ${error.message}`);
      return this.toPascalCase(componentName);
    }
  }

  extractTagNameRobust(content, componentName) {
    try {
      // Buscar customElements.define
      const defineMatch = content.match(/customElements\.define\s*\(\s*['""]([^'""]+)['""],/);
      if (defineMatch) {
        return defineMatch[1];
      }
      
      // Fallback: generar desde nombre del componente
      this.addWarning(componentName, 'No se encontró tag name, generando desde nombre del archivo');
      return `tl-${componentName}`;
      
    } catch (error) {
      this.addError(componentName, `Error extrayendo tag name: ${error.message}`);
      return `tl-${componentName}`;
    }
  }

  validateComponentInfo(componentName, className, tagName, properties) {
    // Validar que el className sea válido
    if (!className || !/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      this.addWarning(componentName, `Nombre de clase '${className}' no sigue convenciones`);
    }
    
    // Validar que el tagName sea válido
    if (!tagName || !tagName.includes('-')) {
      this.addWarning(componentName, `Tag name '${tagName}' debería contener al menos un guión`);
    }
    
    // Validar que tenga al menos una property
    if (Object.keys(properties).length === 0) {
      this.addWarning(componentName, 'Componente sin properties detectadas');
    }
  }

  getControlType(type) {
    const controlMap = {
      'String': 'text',
      'Number': 'number',
      'Boolean': 'boolean',
      'Array': 'object',
      'Object': 'object',
      'Function': 'text',  // Functions no son editables
      'Date': 'date'
    };
    return controlMap[type] || 'text';
  }

  generateStoryContent(componentInfo) {
    if (!componentInfo.isValid) {
      return this.generateFallbackStory(componentInfo);
    }
    
    const { name, properties, metadata, tagName } = componentInfo;
    
    // Usar el generador original pero con validaciones
    const defaultArgs = this.generateDefaultArgsRobust(properties, metadata, name);
    const argTypes = this.generateArgTypesRobust(properties, metadata, name);
    
    return `import '../../design-system.stories.js';
import './${name}.js';

export default {
  title: 'Components/${this.toTitleCase(name)}',
  component: '${tagName}',
  argTypes: ${JSON.stringify(argTypes, null, 4)},
  parameters: {
    docs: {
      description: {
        component: \`
# ${this.toTitleCase(name)}

${this.generateComponentDescription(name, metadata)}

## Características

- ✅ Responsive design
- ✅ Accesible (ARIA)
- ✅ Theming con design tokens
- ✅ Integración WordPress automática

## Uso en WordPress

${this.generateWordPressUsage(name, metadata)}

${this.generateWarningsSection(name)}
        \`
      }
    }
  }
};

const Template = (args) => {
  const element = document.createElement('${tagName}');
  ${this.generateElementPropertyAssignments(properties, name)}
  return element;
};

export const Default = Template.bind({});
Default.args = ${JSON.stringify(defaultArgs, null, 2)};

${this.generateVariantStoriesRobust(name, metadata, properties)}
`;
  }

  generateFallbackStory(componentInfo) {
    const { name, tagName } = componentInfo;
    
    return `import '../../design-system.stories.js';
import './${name}.js';

export default {
  title: 'Components/${this.toTitleCase(name)} (Fallback)',
  component: '${tagName || `tl-${name}`}',
  parameters: {
    docs: {
      description: {
        component: \`
# ${this.toTitleCase(name)} (Generación con Errores)

⚠️ **Advertencia**: Este story se generó en modo fallback debido a errores en el análisis del componente.

## Errores Detectados

${this.getComponentErrors(name).map(error => `- ❌ ${error.message}`).join('\n')}

## Advertencias

${this.getComponentWarnings(name).map(warning => `- ⚠️ ${warning.message}`).join('\n')}

## Recomendaciones

1. Revisa la sintaxis del componente
2. Asegúrate de que \`static properties\` esté bien definido
3. Verifica que la clase se exporte correctamente
4. Regenera los stories después de corregir los errores
        \`
      }
    }
  }
};

const Template = (args) => {
  const element = document.createElement('${tagName || `tl-${name}`}');
  element.textContent = args.content || 'Componente cargado en modo fallback';
  return element;
};

export const Default = Template.bind({});
Default.args = {
  content: 'Revisa la documentación para corregir los errores'
};
`;
  }

  generateDefaultArgsRobust(properties, metadata, componentName) {
    // 1. Priorizar mocks personalizados del desarrollador
    const customMocks = this.loadCustomMocks(componentName);
    if (customMocks && customMocks.defaultArgs) {
      return customMocks.defaultArgs;
    }
    
    // 2. Priorizar metadata si existe
    if (metadata && metadata.parameters) {
      const args = {};
      metadata.parameters.forEach(param => {
        args[param.name] = this.generateExampleValueSafe(param.type, param.name);
      });
      return args;
    }
    
    // 3. Usar properties detectadas
    const args = {};
    Object.keys(properties).forEach(prop => {
      const propInfo = properties[prop];
      args[prop] = this.generateExampleValueSafe(propInfo.type, prop);
    });
    
    // 4. Si no hay properties, valores genéricos
    if (Object.keys(args).length === 0) {
      this.addWarning(componentName, 'Usando args genéricos por falta de properties');
      return {
        title: 'Título de ejemplo',
        content: 'Contenido de ejemplo'
      };
    }
    
    return args;
  }

  loadCustomMocks(componentName) {
    try {
      const mocksPath = path.join(this.componentsDir, componentName, `${componentName}.mocks.js`);
      
      if (!fs.existsSync(mocksPath)) {
        return null; // No hay archivo de mocks personalizado
      }

      // Limpiar la caché de require para permitir recarga
      delete require.cache[require.resolve(mocksPath)];
      
      // Cargar el módulo directamente
      const mockObject = require(mocksPath);
      
      console.log(`📦 Usando mocks personalizados para ${componentName}`);
      return mockObject;
      
    } catch (error) {
      this.addWarning(componentName, `Error cargando mocks personalizados: ${error.message}`);
      return null;
    }
  }

  generateExampleValueSafe(type, propName) {
    try {
      // Usar el método original con try-catch
      return this.generateExampleValue(type, propName);
    } catch (error) {
      // Fallback seguro
      return type === 'Boolean' ? false : 
             type === 'Number' ? 0 :
             type === 'Array' ? [] :
             type === 'Object' ? {} : 
             'Ejemplo';
    }
  }

  generateExampleValue(type, propName) {
    const nameMap = {
      title: 'Título del Componente',
      subtitle: 'Subtítulo descriptivo',
      description: 'Descripción detallada del componente',
      content: 'Contenido de ejemplo',
      text: 'Texto de ejemplo',
      name: 'Nombre',
      value: 'Valor',
      data: [
        { id: 1, title: 'Elemento 1', description: 'Descripción del elemento 1' },
        { id: 2, title: 'Elemento 2', description: 'Descripción del elemento 2' }
      ],
      items: [
        { title: 'Item 1', value: 'valor1' },
        { title: 'Item 2', value: 'valor2' }
      ],
      list: ['Opción 1', 'Opción 2', 'Opción 3'],
      features: [
        { title: 'Característica 1', description: 'Descripción de la característica', icon: '🚀' },
        { title: 'Característica 2', description: 'Otra descripción útil', icon: '✨' },
        { title: 'Característica 3', description: 'Más información detallada', icon: '⭐' }
      ],
      testimonials: [
        { name: 'Juan Pérez', role: 'Cliente', content: 'Excelente servicio', rating: 5 },
        { name: 'María García', role: 'Usuario', content: 'Muy recomendable', rating: 4 }
      ],
      image: 'https://picsum.photos/400/300',
      images: [
        { url: 'https://picsum.photos/400/300?random=1', title: 'Imagen 1', alt: 'Descripción imagen 1' },
        { url: 'https://picsum.photos/400/300?random=2', title: 'Imagen 2', alt: 'Descripción imagen 2' },
        { url: 'https://picsum.photos/400/300?random=3', title: 'Imagen 3', alt: 'Descripción imagen 3' }
      ],
      src: 'https://picsum.photos/400/300',
      href: '#',
      link: '#',
      url: 'https://ejemplo.com',
      email: 'ejemplo@dominio.com',
      phone: '+51 999 999 999',
      price: 'S/ 99.99',
      count: 1,
      quantity: 1,
      size: 'medium',
      color: 'blue',
      variant: 'primary',
      status: 'active',
      visible: true,
      hidden: false,
      disabled: false,
      loading: false,
      error: false,
      success: false,
      active: false,
      selected: false,
      checked: false,
      required: false,
      readonly: false,
      multiple: false,
      autoplay: false,
      loop: false,
      controls: true,
      muted: false
    };

    if (nameMap[propName.toLowerCase()]) {
      return nameMap[propName.toLowerCase()];
    }

    // Valores por tipo
    switch (type?.toLowerCase()) {
      case 'string': return `Valor para ${propName}`;
      case 'number': return 42;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      case 'function': return '() => console.log("función de ejemplo")';
      case 'date': return new Date().toISOString().split('T')[0];
      default: return '';
    }
  }

  generateArgTypesRobust(properties, metadata, componentName) {
    const argTypes = {};
    
    try {
      const props = metadata?.parameters || Object.keys(properties).map(key => ({
        name: key,
        type: properties[key].type?.toLowerCase() || 'string'
      }));

      props.forEach(prop => {
        const propInfo = properties[prop.name] || {};
        argTypes[prop.name] = {
          control: propInfo.control || this.getControlType(prop.type)
        };
        
        // Agregar descripción
        if (metadata?.parameters) {
          const metaProp = metadata.parameters.find(p => p.name === prop.name);
          if (metaProp) {
            argTypes[prop.name].description = `Tipo: ${metaProp.type}. Default: "${metaProp.default}"`;
          }
        } else if (propInfo.detectedIn) {
          argTypes[prop.name].description = `Detectado en: ${propInfo.detectedIn}`;
        }
      });
    } catch (error) {
      this.addError(componentName, `Error generando argTypes: ${error.message}`);
    }
    
    return argTypes;
  }

  generateTemplateAttributesRobust(properties, componentName) {
    try {
      const props = Object.keys(properties);
      
      if (props.length === 0) {
        // Fallback genérico
        return '.title=${args.title || ""}\n    .content=${args.content || ""}';
      }

      return props
        .map(prop => {
          const propInfo = properties[prop];
          const type = propInfo.type;
          
          if (type === 'Boolean') {
            return `?${prop}=\${args.${prop}}`;
          } else if (type === 'Array' || type === 'Object') {
            return `.${prop}=\${args.${prop}}`;
          } else {
            return `.${prop}=\${args.${prop}}`;
          }
        })
        .join('\n    ');
    } catch (error) {
      this.addError(componentName, `Error generando template attributes: ${error.message}`);
      return '.title=${args.title || ""}';
    }
  }

  generateElementPropertyAssignments(properties, componentName) {
    try {
      const props = Object.keys(properties);
      
      if (props.length === 0) {
        // Fallback genérico
        return `element.title = args.title || '';
  element.content = args.content || '';`;
      }

      return props
        .map(prop => {
          const propInfo = properties[prop];
          return `element.${prop} = args.${prop};`;
        })
        .join('\n  ');
    } catch (error) {
      this.addError(componentName, `Error generando property assignments: ${error.message}`);
      return 'element.title = args.title || "";';
    }
  }

  generateVariantStoriesRobust(name, metadata, properties) {
    let stories = '';
    
    try {
      // Cargar mocks personalizados para variantes
      const customMocks = this.loadCustomMocks(name);
      
      if (customMocks && customMocks.variants) {
        // Usar variantes personalizadas
        Object.keys(customMocks.variants).forEach(variantName => {
          const variantData = customMocks.variants[variantName];
          const capitalizedName = this.toPascalCase(variantName);
          
          stories += `
export const ${capitalizedName} = Template.bind({});
${capitalizedName}.args = ${JSON.stringify(variantData, null, 2)};
`;
        });
      } else {
        // Usar variantes por defecto
        stories += `
export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};
`;
        
        // Historia con datos (solo si es apropiado)
        if (metadata?.type === 'aggregated' || Object.keys(properties).some(p => 
            ['testimonials', 'features', 'items', 'data'].includes(p.toLowerCase()))) {
          stories += this.generateWithDataStory(name, metadata);
        }
        
        // Historia destacada (si tiene property featured)
        if (Object.keys(properties).some(p => p.toLowerCase() === 'featured')) {
          stories += `
export const Featured = Template.bind({});
Featured.args = {
  ...Default.args,
  featured: true
};
`;
        }
      }
      
    } catch (error) {
      this.addWarning(name, `Error generando variant stories: ${error.message}`);
    }
    
    return stories;
  }

  generateWithDataStory(name, metadata) {
    if (name.includes('testimonials') || name.includes('testimonio')) {
      return `
export const WithTestimonials = Template.bind({});
WithTestimonials.args = {
  ...Default.args,
  testimonials: [
    { name: 'Ana García', role: 'Diseñadora', content: 'Excelente curso', rating: 5 },
    { name: 'Carlos López', role: 'Desarrollador', content: 'Muy recomendado', rating: 5 }
  ]
};
`;
    }
    
    if (name.includes('feature') || name.includes('grid')) {
      return `
export const WithFeatures = Template.bind({});
WithFeatures.args = {
  ...Default.args,
  features: [
    { title: 'Responsive', description: 'Adaptable a cualquier pantalla', icon: '📱' },
    { title: 'Accesible', description: 'Cumple estándares WCAG', icon: '♿' },
    { title: 'Rápido', description: 'Carga optimizada', icon: '⚡' }
  ]
};
`;
    }
    
    return `
export const WithData = Template.bind({});
WithData.args = {
  ...Default.args,
  items: [
    { id: 1, name: 'Item 1', value: 'Valor 1' },
    { id: 2, name: 'Item 2', value: 'Valor 2' }
  ]
};
`;
  }

  generateWarningsSection(componentName) {
    const warnings = this.getComponentWarnings(componentName);
    const errors = this.getComponentErrors(componentName);
    
    if (warnings.length === 0 && errors.length === 0) {
      return '';
    }
    
    let section = '\n## ⚠️ Notas de Generación\n\n';
    
    if (errors.length > 0) {
      section += '### Errores:\n\n';
      errors.forEach(error => {
        section += `- ❌ ${error.message}\n`;
      });
    }
    
    if (warnings.length > 0) {
      section += '\n### Advertencias:\n\n';
      warnings.forEach(warning => {
        section += `- ⚠️ ${warning.message}\n`;
      });
    }
    
    return section;
  }

  // Métodos de utilidad para errores y warnings
  addError(component, message) {
    this.errors.push({ component, message, timestamp: new Date() });
  }

  addWarning(component, message) {
    this.warnings.push({ component, message, timestamp: new Date() });
  }

  getComponentErrors(componentName) {
    return this.errors.filter(e => e.component === componentName);
  }

  getComponentWarnings(componentName) {
    return this.warnings.filter(w => w.component === componentName);
  }

  // Métodos de utilidad (reutilizar del generador original)
  generateComponentDescription(name, metadata) {
    const descriptions = {
      'feature-grid': 'Grilla de características organizadas',
      'interactive-gallery': 'Galería interactiva con navegación',
      'product-card': 'Tarjeta de producto con información detallada',
      'testimonial': 'Testimonio de usuario o cliente'
    };
    return descriptions[name] || 'Componente del design system';
  }

  generateWordPressUsage(name, metadata) {
    if (metadata?.type === 'static') {
      return `Componente estático integrado con WordPress.`;
    }
    return `Integración automática con WordPress.`;
  }

  toPascalCase(str) {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }

  toTitleCase(str) {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Método principal
  async generateStories() {
    console.log('🔍 Generador Robusto: Buscando componentes sin stories...');
    
    const componentsWithoutStories = this.findComponentsWithoutStories();
    
    if (componentsWithoutStories.length === 0) {
      console.log('✅ Todos los componentes ya tienen stories!');
      return { success: true, generated: 0, errors: [], warnings: [] };
    }

    console.log(`📝 Encontrados ${componentsWithoutStories.length} componentes sin stories:`);
    componentsWithoutStories.forEach(name => console.log(`   - ${name}`));

    let generated = 0;
    let failed = 0;

    for (const componentName of componentsWithoutStories) {
      console.log(`\n🎯 Generando stories para: ${componentName}`);
      
      try {
        const componentInfo = this.analyzeComponent(componentName);
        
        if (!componentInfo) {
          console.log(`❌ No se pudo analizar: ${componentName}`);
          failed++;
          continue;
        }
        
        const storyContent = this.generateStoryContent(componentInfo);
        
        const storiesPath = path.join(
          this.componentsDir, 
          componentName, 
          `${componentName}.stories.js`
        );
        
        fs.writeFileSync(storiesPath, storyContent);
        
        if (componentInfo.isValid) {
          console.log(`✅ Stories generados: ${componentName}`);
        } else {
          console.log(`⚠️ Stories generados con fallback: ${componentName}`);
        }
        
        generated++;
        
        // Mostrar warnings para este componente
        const warnings = this.getComponentWarnings(componentName);
        if (warnings.length > 0) {
          console.log(`   Advertencias (${warnings.length}):`);
          warnings.forEach(w => console.log(`     - ${w.message}`));
        }
        
      } catch (error) {
        console.error(`❌ Error generando stories para ${componentName}:`, error.message);
        failed++;
      }
    }

    // Resumen final
    console.log(`\n📊 Resumen de Generación:`);
    console.log(`   ✅ Generados exitosamente: ${generated}`);
    console.log(`   ❌ Fallaron: ${failed}`);
    console.log(`   ⚠️ Total de advertencias: ${this.warnings.length}`);
    console.log(`   🚨 Total de errores: ${this.errors.length}`);

    if (this.warnings.length > 0 || this.errors.length > 0) {
      console.log(`\n💡 Recomendaciones:`);
      console.log(`   1. Revisa los componentes con advertencias`);
      console.log(`   2. Corrige los errores de sintaxis`);
      console.log(`   3. Regenera los stories después de las correcciones`);
      console.log(`   4. Verifica que todos los stories funcionen en Storybook`);
    }

    return {
      success: failed === 0,
      generated,
      failed,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const generator = new RobustStoryGenerator();
  generator.generateStories()
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        console.log('\n🚨 Generación completada con errores.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal en la generación:', error);
      process.exit(1);
    });
}

module.exports = RobustStoryGenerator;