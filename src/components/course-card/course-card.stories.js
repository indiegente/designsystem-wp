import '../../design-system.stories.js';
import './course-card.js';

export default {
  title: 'Components/Course Card',
  component: 'course-card',
  argTypes: {
    "title": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "description": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "image": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "link": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "linkText": {
        "control": "text",
        "description": "Tipo: string. Default: \"Ver más\""
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Course Card

Componente del design system

## Características

- ✅ Responsive design
- ✅ Accesible (ARIA)
- ✅ Theming con design tokens
- ✅ Integración WordPress automática

## Uso en WordPress

Integración automática con WordPress.


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
  const element = document.createElement('course-card');
  element.title = args.title;
  element.description = args.description;
  element.image = args.image;
  element.link = args.link;
  element.linkText = args.linkText;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "title": "Título del Componente",
  "description": "Descripción detallada del componente",
  "image": "https://picsum.photos/400/300",
  "link": "#",
  "linkText": "Valor para linkText"
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

