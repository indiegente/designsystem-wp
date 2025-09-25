import '../../design-system.stories.js';
import './error-404.js';

export default {
  title: 'Components/Error 404',
  component: 'error-404',
  argTypes: {
    "title": {
        "control": "text",
        "description": "Tipo: string. Default: \"404\""
    },
    "subtitle": {
        "control": "text",
        "description": "Tipo: string. Default: \"Página no encontrada\""
    },
    "description": {
        "control": "text",
        "description": "Tipo: string. Default: \"Lo sentimos, la página que buscas no existe o ha sido movida.\""
    },
    "homeUrl": {
        "control": "text",
        "description": "Tipo: string. Default: \"/\""
    },
    "homeText": {
        "control": "text",
        "description": "Tipo: string. Default: \"Volver al inicio\""
    },
    "showSearch": {
        "control": "text",
        "description": "Tipo: boolean. Default: \"true\""
    },
    "showSuggestions": {
        "control": "text",
        "description": "Tipo: boolean. Default: \"true\""
    },
    "suggestions": {
        "control": "text",
        "description": "Tipo: array. Default: \"array()\""
    },
    "handleSearch": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "searchPlaceholder": {
        "control": "text",
        "description": "Tipo: string. Default: \"Buscar...\""
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Error 404

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
  const element = document.createElement('error-404');
  element.title = args.title;
  element.subtitle = args.subtitle;
  element.description = args.description;
  element.homeUrl = args.homeUrl;
  element.homeText = args.homeText;
  element.showSearch = args.showSearch;
  element.showSuggestions = args.showSuggestions;
  element.suggestions = args.suggestions;
  element.handleSearch = args.handleSearch;
  element.searchPlaceholder = args.searchPlaceholder;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "title": "Título del Componente",
  "subtitle": "Subtítulo descriptivo",
  "description": "Descripción detallada del componente",
  "homeUrl": "Valor para homeUrl",
  "homeText": "Valor para homeText",
  "showSearch": false,
  "showSuggestions": false,
  "suggestions": [],
  "handleSearch": "Valor para handleSearch",
  "searchPlaceholder": "Valor para searchPlaceholder"
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

