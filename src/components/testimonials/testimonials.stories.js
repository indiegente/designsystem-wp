import '../../design-system.stories.js';
import './testimonials.js';

export default {
  title: 'Components/Testimonials',
  component: 'tl-testimonials',
  argTypes: {
    "title": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "subtitle": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "testimonials": {
        "control": "object",
        "description": "Tipo: array. Default: \"[]\""
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Testimonials

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
  const element = document.createElement('tl-testimonials');
  element.title = args.title;
  element.subtitle = args.subtitle;
  element.testimonials = args.testimonials;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "title": "Título del Componente",
  "subtitle": "Subtítulo descriptivo",
  "testimonials": [
    {
      "name": "Juan Pérez",
      "role": "Cliente",
      "content": "Excelente servicio",
      "rating": 5
    },
    {
      "name": "María García",
      "role": "Usuario",
      "content": "Muy recomendable",
      "rating": 4
    }
  ]
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

export const WithTestimonials = Template.bind({});
WithTestimonials.args = {
  ...Default.args,
  testimonials: [
    { name: 'Ana García', role: 'Diseñadora', content: 'Excelente curso', rating: 5 },
    { name: 'Carlos López', role: 'Desarrollador', content: 'Muy recomendado', rating: 5 }
  ]
};

