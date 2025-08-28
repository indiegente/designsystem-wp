import '../../design-system.stories.js';
import './interactive-gallery.js';

export default {
  title: 'Components/Interactive Gallery',
  component: 'tl-interactive-gallery',
  argTypes: {
    "title": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "subtitle": {
        "control": "text",
        "description": "Tipo: string. Default: \"\""
    },
    "images": {
        "control": "object",
        "description": "Tipo: array. Default: \"[]\""
    },
    "autoPlay": {
        "control": "boolean",
        "description": "Tipo: boolean. Default: \"true\""
    },
    "showThumbnails": {
        "control": "boolean",
        "description": "Tipo: boolean. Default: \"true\""
    }
},
  parameters: {
    docs: {
      description: {
        component: `
# Interactive Gallery

Galería interactiva con navegación

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
  const element = document.createElement('tl-interactive-gallery');
  element.title = args.title;
  element.subtitle = args.subtitle;
  element.images = args.images;
  element.autoPlay = args.autoPlay;
  element.showThumbnails = args.showThumbnails;
  element.currentIndex = args.currentIndex;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  "title": "Galería de Proyectos",
  "subtitle": "Explora nuestros trabajos más destacados",
  "autoPlay": true,
  "showThumbnails": true,
  "currentIndex": 0,
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop",
      "title": "Proyecto de Diseño Web",
      "alt": "Captura de pantalla de un sitio web moderno"
    },
    {
      "url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
      "title": "Aplicación Móvil",
      "alt": "Interfaz de una aplicación móvil innovadora"
    },
    {
      "url": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      "title": "Dashboard Analytics",
      "alt": "Panel de control con gráficos y métricas"
    },
    {
      "url": "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop",
      "title": "E-commerce Platform",
      "alt": "Plataforma de comercio electrónico"
    }
  ]
};


export const Minimal = Template.bind({});
Minimal.args = {
  "title": "Galería Simple",
  "subtitle": "Algunas imágenes de muestra",
  "autoPlay": false,
  "showThumbnails": false,
  "currentIndex": 0,
  "images": [
    {
      "url": "https://picsum.photos/800/600?random=1",
      "title": "Imagen 1",
      "alt": "Primera imagen de ejemplo"
    },
    {
      "url": "https://picsum.photos/800/600?random=2",
      "title": "Imagen 2",
      "alt": "Segunda imagen de ejemplo"
    }
  ]
};

export const Portfolio = Template.bind({});
Portfolio.args = {
  "title": "Portfolio Profesional",
  "subtitle": "Trabajos realizados por nuestro equipo",
  "autoPlay": true,
  "showThumbnails": true,
  "currentIndex": 0,
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      "title": "Branding Corporativo",
      "alt": "Proyecto de identidad visual corporativa"
    },
    {
      "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
      "title": "Campaña Digital",
      "alt": "Campaña de marketing digital exitosa"
    },
    {
      "url": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop",
      "title": "Consultoría Estratégica",
      "alt": "Proyecto de consultoría y análisis"
    }
  ]
};

export const Loading = Template.bind({});
Loading.args = {
  "title": "Galería",
  "subtitle": "Cargando imágenes...",
  "autoPlay": false,
  "showThumbnails": true,
  "currentIndex": 0,
  "images": []
};

