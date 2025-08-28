#!/usr/bin/env node

/**
 * Script para generar automáticamente Storybook stories
 * para componentes que no tienen stories definidos
 */

const fs = require('fs');
const path = require('path');

class StoryGenerator {
  constructor() {
    this.componentsDir = path.join(process.cwd(), 'src', 'components');
    this.metadata = this.loadMetadata();
  }

  loadMetadata() {
    const metadataPath = path.join(process.cwd(), 'src', 'component-metadata.json');
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return {};
  }

  findComponentsWithoutStories() {
    const components = fs.readdirSync(this.componentsDir);
    const componentsWithoutStories = [];

    for (const componentName of components) {
      const componentPath = path.join(this.componentsDir, componentName);
      if (!fs.statSync(componentPath).isDirectory()) continue;

      const componentFile = path.join(componentPath, `${componentName}.js`);
      const storiesFile = path.join(componentPath, `${componentName}.stories.js`);

      if (fs.existsSync(componentFile) && !fs.existsSync(storiesFile)) {
        componentsWithoutStories.push(componentName);
      }
    }

    return componentsWithoutStories;
  }

  analyzeComponent(componentName) {
    const componentPath = path.join(this.componentsDir, componentName, `${componentName}.js`);
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Extraer propiedades del componente Lit
    const properties = this.extractProperties(content);
    
    // Obtener metadata si existe
    const metadata = this.metadata[componentName];
    
    return {
      name: componentName,
      properties,
      metadata,
      className: this.extractClassName(content),
      tagName: this.extractTagName(content)
    };
  }

  extractProperties(content) {
    const propertiesMatch = content.match(/static properties = \{([^}]+)\}/s);
    if (!propertiesMatch) return {};

    const propertiesString = propertiesMatch[1];
    const properties = {};

    // Extraer propiedades con tipos
    const propertyRegex = /(\w+):\s*\{\s*type:\s*(\w+)(?:,\s*(?:attribute|reflect|converter|noAccessor|hasChanged|state):\s*[^,}]+)*\s*\}/g;
    let match;

    while ((match = propertyRegex.exec(propertiesString)) !== null) {
      const [, propName, propType] = match;
      properties[propName] = {
        type: propType,
        control: this.getControlType(propType)
      };
    }

    return properties;
  }

  getControlType(type) {
    const typeMap = {
      'String': 'text',
      'Number': 'number',
      'Boolean': 'boolean',
      'Array': 'object',
      'Object': 'object'
    };
    return typeMap[type] || 'text';
  }

  extractClassName(content) {
    const classMatch = content.match(/export class (\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  extractTagName(content) {
    const tagMatch = content.match(/customElements\.define\(['"`]([^'"`]+)['"`]/);
    return tagMatch ? tagMatch[1] : null;
  }

  generateStoryContent(componentInfo) {
    const { name, properties, metadata, tagName } = componentInfo;
    const className = componentInfo.className || this.toPascalCase(name);
    
    // Generar argumentos por defecto basados en metadata o propiedades
    const defaultArgs = this.generateDefaultArgs(properties, metadata);
    
    // Generar argTypes para Storybook
    const argTypes = this.generateArgTypes(properties, metadata);
    
    // Generar ejemplos de datos (placeholder)
    const exampleData = {};

    return `import { html } from 'lit';
import '../design-system.stories.js';
import { ${className} } from './${name}.js';

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
        \`
      }
    }
  }
};

const Template = (args) => html\`
  <${tagName}
    ${this.generateTemplateAttributes(properties)}
  ></${tagName}>
\`;

export const Default = Template.bind({});
Default.args = ${JSON.stringify(defaultArgs, null, 2)};

${this.generateVariantStories(name, metadata, exampleData)}

${this.generateLayoutStories(name, metadata)}
`;
  }

  generateDefaultArgs(properties, metadata) {
    const args = {};
    
    if (metadata && metadata.parameters) {
      // Usar parámetros de metadata como base
      metadata.parameters.forEach(param => {
        args[param.name] = this.generateExampleValue(param.type, param.name);
      });
    } else {
      // Usar propiedades extraídas del componente
      Object.keys(properties).forEach(prop => {
        args[prop] = this.generateExampleValue(properties[prop].type, prop);
      });
    }

    return args;
  }

  generateExampleValue(type, propName) {
    // Valores específicos por nombre de propiedad
    const nameMap = {
      title: 'Título del Componente',
      subtitle: 'Subtítulo descriptivo del componente',
      description: 'Descripción detallada que explica la funcionalidad y propósito de este componente.',
      image: 'https://picsum.photos/400/300',
      images: ['https://picsum.photos/400/300', 'https://picsum.photos/401/300', 'https://picsum.photos/402/300'],
      icon: '✨',
      link: '#',
      linkText: 'Ver más',
      ctaText: 'Llamada a la acción',
      buttonText: 'Botón',
      name: 'Nombre de ejemplo',
      role: 'Rol o posición',
      content: 'Contenido de ejemplo para demostrar la funcionalidad.',
      rating: 5,
      price: 'S/ 1,200',
      category: 'Categoría',
      featured: false,
      autoPlay: false,
      showThumbnails: true,
      testimonials: [
        {
          name: 'María García',
          role: 'Estudiante de Diseño',
          content: 'Excelente experiencia, muy recomendado.',
          rating: 5,
          avatar: 'https://picsum.photos/64/64'
        }
      ],
      features: [
        {
          title: 'Característica 1',
          description: 'Descripción de la primera característica',
          icon: '🚀'
        },
        {
          title: 'Característica 2', 
          description: 'Descripción de la segunda característica',
          icon: '✨'
        }
      ]
    };

    if (nameMap[propName]) {
      return nameMap[propName];
    }

    // Valores por tipo
    switch (type?.toLowerCase()) {
      case 'string':
        return `Valor de ejemplo para ${propName}`;
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return '';
    }
  }

  generateArgTypes(properties, metadata) {
    const argTypes = {};
    
    const props = metadata?.parameters || Object.keys(properties).map(key => ({
      name: key,
      type: properties[key].type?.toLowerCase() || 'string'
    }));

    props.forEach(prop => {
      const control = properties[prop.name]?.control || this.getControlType(prop.type);
      argTypes[prop.name] = { control };
      
      // Agregar descripción si es posible
      if (metadata?.parameters) {
        const metaProp = metadata.parameters.find(p => p.name === prop.name);
        if (metaProp) {
          argTypes[prop.name].description = `Tipo: ${metaProp.type}. Valor por defecto: "${metaProp.default}"`;
        }
      }
    });

    return argTypes;
  }

  generateTemplateAttributes(properties) {
    const props = Object.keys(properties);
    if (props.length === 0) {
      return '.title=${args.title}\n    .subtitle=${args.subtitle}\n    .features=${args.features}';
    }

    return props
      .map(prop => {
        const type = properties[prop].type;
        if (type === 'Boolean') {
          return `?${prop}=\${args.${prop}}`;
        } else if (type === 'Array' || type === 'Object') {
          return `.${prop}=\${args.${prop}}`;
        } else {
          return `.${prop}=\${args.${prop}}`;
        }
      })
      .join('\n    ');
  }

  generateVariantStories(name, metadata, exampleData) {
    let stories = '';

    // Historia con datos mínimos
    stories += `
export const Minimal = Template.bind({});
Minimal.args = {
  ${this.generateMinimalArgs(metadata)}
};
`;

    // Historia con datos completos (si aplica)
    if (metadata?.type === 'aggregated' || name.includes('testimonials') || name.includes('features')) {
      stories += `
export const WithData = Template.bind({});
WithData.args = {
  ...Default.args,
  ${this.generateDataArgs(name, metadata)}
};
`;
    }

    // Historia destacada (si aplica)
    if (metadata?.parameters?.some(p => p.name === 'featured')) {
      stories += `
export const Featured = Template.bind({});
Featured.args = {
  ...Default.args,
  featured: true
};
`;
    }

    return stories;
  }

  generateLayoutStories(name, metadata) {
    // Para componentes que se usan en grillas
    if (name.includes('card') || metadata?.type === 'iterative') {
      return `
export const Grid = () => html\`
  <div style="
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
    gap: 2rem; 
    padding: 2rem;
  ">
    \${Template(Default.args)}
    \${Template({...Default.args, featured: true})}
    \${Template(Minimal.args)}
  </div>
\`;
`;
    }

    return '';
  }

  generateMinimalArgs(metadata) {
    if (!metadata?.parameters) return 'title: "Título"';
    
    const essentialProps = metadata.parameters
      .filter(param => param.name === 'title' || param.default === '')
      .slice(0, 2);

    return essentialProps
      .map(prop => `${prop.name}: "${this.generateExampleValue(prop.type, prop.name)}"`)
      .join(',\n  ');
  }

  generateDataArgs(name, metadata) {
    if (name.includes('testimonials')) {
      return `testimonials: [
    {
      name: 'Ana Rodríguez',
      role: 'Diseñadora Gráfica',
      content: 'Una experiencia increíble que cambió mi carrera profesional.',
      rating: 5,
      avatar: 'https://picsum.photos/65/65'
    },
    {
      name: 'Carlos Méndez', 
      role: 'Desarrollador Web',
      content: 'Los conocimientos adquiridos fueron fundamentales para mi crecimiento.',
      rating: 5,
      avatar: 'https://picsum.photos/66/66'
    }
  ]`;
    }

    if (name.includes('feature') || name.includes('grid')) {
      return `features: [
    { title: 'Diseño Responsivo', description: 'Adaptable a cualquier dispositivo', icon: '📱' },
    { title: 'Fácil de Usar', description: 'Interfaz intuitiva y amigable', icon: '🎨' },
    { title: 'Altamente Configurable', description: 'Personalizable según tus necesidades', icon: '⚙️' }
  ]`;
    }

    return '';
  }

  generateComponentDescription(name, metadata) {
    const descriptions = {
      'feature-grid': 'Componente para mostrar características o servicios en una grilla organizada y atractiva.',
      'interactive-gallery': 'Galería de imágenes interactiva con funcionalidades avanzadas como autoplay y lightbox.',
      'product-card': 'Tarjeta para mostrar productos con información detallada y llamadas a la acción.',
      'service-card': 'Componente para presentar servicios de manera profesional y atractiva.'
    };

    if (descriptions[name]) {
      return descriptions[name];
    }

    if (metadata?.type === 'static') {
      return 'Componente estático con propiedades configurables.';
    } else if (metadata?.type === 'iterative') {
      return 'Componente que se renderiza individualmente para cada elemento de datos.';
    } else if (metadata?.type === 'aggregated') {
      return 'Componente que agrupa y muestra colecciones de datos de forma organizada.';
    }

    return 'Componente personalizable del design system.';
  }

  generateWordPressUsage(name, metadata) {
    if (metadata?.type === 'static') {
      return `Este componente se puede usar directamente en plantillas WordPress llamando a \`${metadata.phpFunction}()\`.`;
    } else if (metadata?.type === 'iterative') {
      const postType = this.metadata.componentMapping?.[name] || 'post';
      return `Se integra automáticamente con posts del tipo "${postType}" en WordPress.`;
    } else if (metadata?.type === 'aggregated') {
      return `Recopila y muestra datos agregados de múltiples posts de WordPress.`;
    }

    return 'Integración automática con WordPress mediante el sistema de generación de templates.';
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

  async generateStories() {
    console.log('🔍 Buscando componentes sin stories...');
    
    const componentsWithoutStories = this.findComponentsWithoutStories();
    
    if (componentsWithoutStories.length === 0) {
      console.log('✅ Todos los componentes ya tienen stories!');
      return;
    }

    console.log(`📝 Encontrados ${componentsWithoutStories.length} componentes sin stories:`);
    componentsWithoutStories.forEach(name => console.log(`   - ${name}`));

    for (const componentName of componentsWithoutStories) {
      console.log(`\n🎯 Generando stories para: ${componentName}`);
      
      try {
        const componentInfo = this.analyzeComponent(componentName);
        const storyContent = this.generateStoryContent(componentInfo);
        
        const storiesPath = path.join(
          this.componentsDir, 
          componentName, 
          `${componentName}.stories.js`
        );
        
        fs.writeFileSync(storiesPath, storyContent);
        console.log(`✅ Stories generados: ${storiesPath}`);
        
      } catch (error) {
        console.error(`❌ Error generando stories para ${componentName}:`, error.message);
      }
    }

    console.log(`\n🎉 Generación completa! Stories creados para ${componentsWithoutStories.length} componentes.`);
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Ejecuta: npm run storybook');
    console.log('   2. Revisa y personaliza los stories generados');
    console.log('   3. Agrega casos de uso específicos si es necesario');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const generator = new StoryGenerator();
  generator.generateStories().catch(console.error);
}

module.exports = StoryGenerator;