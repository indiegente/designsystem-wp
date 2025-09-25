import '../../design-system.stories.js';
import './site-header.js';

export default {
  title: 'Components/Site Header',
  component: 'site-header',
  argTypes: {
    "siteName": {
        "control": "text"
    },
    "homeUrl": {
        "control": "text"
    },
    "showNavigation": {
        "control": "boolean"
    },
    "navigationItems": {
        "control": "object"
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Site Header

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
  const element = document.createElement('site-header');
  element.siteName = args.siteName;
  element.homeUrl = args.homeUrl;
  element.showNavigation = args.showNavigation;
  element.navigationItems = args.navigationItems;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "siteName": "Valor para siteName",
  "homeUrl": "Valor para homeUrl",
  "showNavigation": false,
  "navigationItems": []
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

