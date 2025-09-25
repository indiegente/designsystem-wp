#!/usr/bin/env node

/**
 * Generador Robusto de Stories - Versión Mejorada
 * 
 * Esta versión maneja casos edge y patrones complejos que pueden
 * romper la generación automática de stories.
 */

const fs = require('fs');
const path = require('path');
const ConfigSingleton = require('../../scripts/wp-generator/core/config-singleton');

class RobustStoryGenerator {
  constructor() {
    // 🎯 SINGLE SOURCE OF TRUTH: ConfigSingleton
    this.config = ConfigSingleton.getInstance();
    this.componentsDir = path.join(process.cwd(), this.config.getFullConfig().paths.components);
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Usar ConfigSingleton.getMetadata()
   * NO leer archivos directamente - fail fast si no existe
   */
  getMetadata() {
    try {
      return this.config.getMetadata();
    } catch (error) {
      throw new Error(`❌ FAIL FAST: ${error.message}`);
    }
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
      if (!fs.existsSync(componentPath)) {
        throw new Error(`❌ FAIL FAST: Componente no encontrado: ${componentPath}`);
      }

      const content = fs.readFileSync(componentPath, 'utf8');

      // Validar que el archivo sea válido JavaScript
      this.validateJavaScript(content, componentName);

      // 🎯 SINGLE SOURCE OF TRUTH: Usar solo metadata.json
      const metadata = this.getMetadata();
      const componentMeta = metadata[componentName];

      if (!componentMeta) {
        throw new Error(`❌ FAIL FAST: Componente '${componentName}' no encontrado en metadata.json`);
      }

      const className = this.extractClassNameRobust(content, componentName);
      const tagName = this.extractTagNameRobust(content, componentName);

      // Validaciones usando metadata como fuente única
      this.validateComponentInfo(componentName, className, tagName, componentMeta);

      return {
        name: componentName,
        metadata: componentMeta,
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

  /**
   * ❌ ELIMINADO: extractPropertiesRobust, parsePropertiesObject, etc.
   * 🎯 SINGLE SOURCE OF TRUTH: Solo usar metadata.json via ConfigSingleton
   */

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

  validateComponentInfo(componentName, className, tagName, componentMeta) {
    // Validar que el className sea válido
    if (!className || !/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      this.addWarning(componentName, `Nombre de clase '${className}' no sigue convenciones`);
    }

    // Validar que el tagName sea válido
    if (!tagName || !tagName.includes('-')) {
      this.addWarning(componentName, `Tag name '${tagName}' debería contener al menos un guión`);
    }

    // Validar metadata obligatoria
    if (!componentMeta.parameters || componentMeta.parameters.length === 0) {
      throw new Error(`❌ FAIL FAST: Componente '${componentName}' sin parameters en metadata.json`);
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

    const { name, metadata, tagName } = componentInfo;

    // 🎯 SINGLE SOURCE OF TRUTH: Usar solo metadata
    const defaultArgs = this.generateDefaultArgsFromMetadata(metadata, name);
    const argTypes = this.generateArgTypesFromMetadata(metadata, name);

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
  ${this.generateElementPropertyAssignmentsFromMetadata(metadata, name)}
  return element;
};

export const Default = Template.bind({});
Default.args = ${JSON.stringify(defaultArgs, null, 2)};

${this.generateVariantStoriesFromMetadata(name, metadata)}
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

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Generar args desde metadata.json únicamente
   */
  generateDefaultArgsFromMetadata(metadata, componentName) {
    if (!metadata.parameters) {
      throw new Error(`❌ FAIL FAST: Componente '${componentName}' sin parameters en metadata.json`);
    }

    // 1. Priorizar mocks personalizados del desarrollador
    const customMocks = this.loadCustomMocks(componentName);
    if (customMocks && customMocks.defaultArgs) {
      return customMocks.defaultArgs;
    }

    // 2. Usar metadata.parameters como fuente única
    const args = {};
    metadata.parameters.forEach(param => {
      args[param.name] = this.generateExampleValueSafe(param.type, param.name);
    });

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

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Generar argTypes desde metadata.json únicamente
   */
  generateArgTypesFromMetadata(metadata, componentName) {
    if (!metadata.parameters) {
      throw new Error(`❌ FAIL FAST: Componente '${componentName}' sin parameters en metadata.json`);
    }

    const argTypes = {};

    metadata.parameters.forEach(param => {
      argTypes[param.name] = {
        control: this.getControlType(param.type)
      };

      // Descripción basada en metadata
      if (param.default !== undefined) {
        argTypes[param.name].description = `Tipo: ${param.type}. Default: "${param.default}"`;
      }
    });

    return argTypes;
  }

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Generar property assignments desde metadata.json
   */
  generateElementPropertyAssignmentsFromMetadata(metadata, componentName) {
    if (!metadata.parameters) {
      throw new Error(`❌ FAIL FAST: Componente '${componentName}' sin parameters en metadata.json`);
    }

    return metadata.parameters
      .map(param => `element.${param.name} = args.${param.name};`)
      .join('\n  ');
  }

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Generar variantes desde metadata.json y mocks
   */
  generateVariantStoriesFromMetadata(name, metadata) {
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

        // Historia con datos basada en metadata type
        if (metadata?.type === 'aggregated') {
          stories += this.generateWithDataStoryFromMetadata(name, metadata);
        }

        // Historia destacada si tiene parameter featured en metadata
        const hasFeatured = metadata.parameters?.some(p => p.name.toLowerCase() === 'featured');
        if (hasFeatured) {
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

  /**
   * 🎯 SINGLE SOURCE OF TRUTH: Generar historias con datos desde metadata
   */
  generateWithDataStoryFromMetadata(name) {
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

  /**
   * 🎯 Generar story para un componente específico
   */
  async generateSingleStory(componentName) {
    console.log(`🎯 Generando story para componente específico: ${componentName}`);

    // Verificar que el componente exista
    const componentPath = path.join(this.componentsDir, componentName, `${componentName}.js`);
    if (!fs.existsSync(componentPath)) {
      throw new Error(`❌ FAIL FAST: Componente '${componentName}' no encontrado en ${componentPath}`);
    }

    // Analizar y generar
    const componentInfo = this.analyzeComponent(componentName);
    if (!componentInfo) {
      throw new Error(`❌ FAIL FAST: No se pudo analizar el componente '${componentName}'`);
    }

    const storyContent = this.generateStoryContent(componentInfo);

    const storiesPath = path.join(
      this.componentsDir,
      componentName,
      `${componentName}.stories.js`
    );

    // Crear backup si existe
    if (fs.existsSync(storiesPath)) {
      const backupPath = `${storiesPath}.backup`;
      fs.copyFileSync(storiesPath, backupPath);
      console.log(`📦 Backup creado: ${componentName}.stories.js.backup`);
    }

    fs.writeFileSync(storiesPath, storyContent);

    if (componentInfo.isValid) {
      console.log(`✅ Story generado exitosamente: ${componentName}`);
    } else {
      console.log(`⚠️ Story generado con fallback: ${componentName}`);
    }

    // Mostrar warnings si existen
    const warnings = this.getComponentWarnings(componentName);
    if (warnings.length > 0) {
      console.log(`   Advertencias (${warnings.length}):`);
      warnings.forEach(w => console.log(`     - ${w.message}`));
    }

    return {
      success: componentInfo.isValid,
      generated: 1,
      failed: componentInfo.isValid ? 0 : 1,
      errors: this.getComponentErrors(componentName),
      warnings: this.getComponentWarnings(componentName)
    };
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

  // Parsear argumentos de línea de comandos
  const args = process.argv.slice(2);
  const componentName = args[0];

  // Mostrar ayuda si se solicita
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧩 Generador Robusto de Stories - Single Source of Truth

📋 Uso:
  node generate-stories-robust.js [componente]     # Generar para componente específico
  node generate-stories-robust.js                  # Generar para todos los componentes sin stories

🎯 Ejemplos:
  node generate-stories-robust.js hero-section     # Solo hero-section
  node generate-stories-robust.js course-card      # Solo course-card

✨ Características:
  • Single Source of Truth: Usa SOLO metadata.json via ConfigSingleton
  • Fail-fast: Error claro si componente no está en metadata
  • Backup automático: Crea .backup antes de sobrescribir
  • Mocks personalizados: Soporte para archivos .mocks.js
    `);
    process.exit(0);
  }

  // Generar para componente específico o todos
  const task = componentName
    ? generator.generateSingleStory(componentName)
    : generator.generateStories();

  task
    .then(result => {
      if (result.success) {
        console.log(componentName
          ? `\n🎉 Story para '${componentName}' generado exitosamente!`
          : `\n🎉 Generación completada exitosamente!`
        );
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