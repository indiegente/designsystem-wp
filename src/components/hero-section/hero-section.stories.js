import '../../design-system.stories.js';
import './hero-section.js';

export default {
  title: 'Components/Hero Section',
  component: 'tl-hero-section',
  argTypes: {
    "title": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "subtitle": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "ctaText": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "backgroundImage": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Hero Section

Componente del design system

## Características

- ✅ Responsive design
- ✅ Accesible (ARIA)
- ✅ Theming con design tokens
- ✅ Integración WordPress automática

## Uso en WordPress

Componente estático integrado con WordPress.


## ⚠️ Notas de Generación


### Advertencias:

- ⚠️ Posible error de sintaxis: Missing comma in properties
- ⚠️ Posible error de sintaxis: Missing comma before closing brace

        `
      }
    }
  }
};

const Template = (args) => {
  const element = document.createElement('tl-hero-section');
  element.title = args.title;
  element.subtitle = args.subtitle;
  element.ctaText = args.ctaText;
  element.backgroundImage = args.backgroundImage;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "title": "Título del Componente",
  "subtitle": "Subtítulo descriptivo",
  "ctaText": "Valor para ctaText",
  "backgroundImage": "Valor para backgroundImage"
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

