import '../../design-system.stories.js';
import './feature-grid.js';

export default {
  title: 'Components/Feature Grid',
  component: 'tl-feature-grid',
  argTypes: {
    "title": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "subtitle": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "features": {
        "control": "object",
        "description": "Tipo: array. Default: \"[]\""
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Feature Grid

Grilla de características organizadas

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
  const element = document.createElement('tl-feature-grid');
  element.title = args.title;
  element.subtitle = args.subtitle;
  element.features = args.features;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "title": "Nuestras Características Principales",
  "subtitle": "Descubre todo lo que podemos ofrecerte",
  "features": [
    {
      "title": "Diseño Responsivo",
      "description": "Se adapta perfectamente a cualquier dispositivo y tamaño de pantalla",
      "icon": "📱"
    },
    {
      "title": "Alto Rendimiento",
      "description": "Optimizado para cargar rápidamente y ofrecer la mejor experiencia",
      "icon": "⚡"
    },
    {
      "title": "Fácil de Usar",
      "description": "Interfaz intuitiva diseñada pensando en la experiencia del usuario",
      "icon": "🎨"
    },
    {
      "title": "Seguridad Avanzada",
      "description": "Protección robusta para mantener tus datos seguros",
      "icon": "🔒"
    }
  ]
};


export const Minimal = Template.bind({});
Minimal.args = {
  "title": "Características Básicas",
  "subtitle": "Lo esencial que necesitas saber",
  "features": [
    {
      "title": "Simple",
      "description": "Fácil de entender",
      "icon": "✨"
    },
    {
      "title": "Eficaz",
      "description": "Resultados garantizados",
      "icon": "🎯"
    }
  ]
};

export const Extensive = Template.bind({});
Extensive.args = {
  "title": "Todas Nuestras Características",
  "subtitle": "Una lista completa de lo que ofrecemos",
  "features": [
    {
      "title": "Desarrollo Ágil",
      "description": "Metodologías modernas para entregas rápidas",
      "icon": "🚀"
    },
    {
      "title": "Soporte 24/7",
      "description": "Estamos aquí cuando nos necesites",
      "icon": "🆘"
    },
    {
      "title": "Escalabilidad",
      "description": "Crece con tu negocio sin limitaciones",
      "icon": "📈"
    },
    {
      "title": "Integración API",
      "description": "Conecta con tus herramientas favoritas",
      "icon": "🔗"
    },
    {
      "title": "Analytics Avanzado",
      "description": "Insights profundos para tomar mejores decisiones",
      "icon": "📊"
    },
    {
      "title": "Personalización",
      "description": "Adapta todo según tus necesidades específicas",
      "icon": "⚙️"
    }
  ]
};

export const Empty = Template.bind({});
Empty.args = {
  "title": "Características",
  "subtitle": "Cargando...",
  "features": []
};

