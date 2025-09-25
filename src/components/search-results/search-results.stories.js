import '../../design-system.stories.js';
import './search-results.js';

export default {
  title: 'Components/Search Results',
  component: 'search-results',
  argTypes: {
    "searchTerm": {
        "control": "text"
    },
    "totalResults": {
        "control": "number"
    },
    "results": {
        "control": "object"
    },
    "showNoResults": {
        "control": "boolean"
    },
    "noResultsTitle": {
        "control": "text"
    },
    "noResultsMessage": {
        "control": "text"
    },
    "showSuggestions": {
        "control": "boolean"
    },
    "suggestions": {
        "control": "object"
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Search Results

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
  const element = document.createElement('search-results');
  element.searchTerm = args.searchTerm;
  element.totalResults = args.totalResults;
  element.results = args.results;
  element.showNoResults = args.showNoResults;
  element.noResultsTitle = args.noResultsTitle;
  element.noResultsMessage = args.noResultsMessage;
  element.showSuggestions = args.showSuggestions;
  element.suggestions = args.suggestions;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "searchTerm": "Valor para searchTerm",
  "totalResults": 42,
  "results": [],
  "showNoResults": false,
  "noResultsTitle": "Valor para noResultsTitle",
  "noResultsMessage": "Valor para noResultsMessage",
  "showSuggestions": false,
  "suggestions": []
};


export const Minimal = Template.bind({});
Minimal.args = {
  title: "Ejemplo Mínimo"
};

