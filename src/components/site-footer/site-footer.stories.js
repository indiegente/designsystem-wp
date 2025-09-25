import '../../design-system.stories.js';
import './site-footer.js';

export default {
  title: 'Components/Site Footer',
  component: 'site-footer',
  argTypes: {
    "siteName": {
        "control": "text"
    },
    "showCopyright": {
        "control": "boolean"
    },
    "showNavigation": {
        "control": "boolean"
    },
    "navigationItems": {
        "control": "object"
    },
    "socialLinks": {
        "control": "object"
    },
    "customText": {
        "control": "text"
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Site Footer

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
  const element = document.createElement('site-footer');
  element.siteName = args.siteName;
  element.showCopyright = args.showCopyright;
  element.showNavigation = args.showNavigation;
  element.navigationItems = args.navigationItems;
  element.socialLinks = args.socialLinks;
  element.customText = args.customText;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "siteName": "Valor para siteName",
  "showCopyright": false,
  "showNavigation": false,
  "navigationItems": [],
  "socialLinks": [],
  "customText": "Valor para customText"
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

