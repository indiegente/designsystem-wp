/**
 * Configuración global del generador WordPress
 * Este archivo centraliza todas las configuraciones para hacer el generador agnóstico al cliente
 */

module.exports = {
  // Configuración del tema
  theme: {
    name: 'toulouse-lautrec', // Nombre fijo del tema para WordPress
    textDomain: 'toulouse-lautrec',
    prefix: 'tl', // Prefijo para funciones PHP y CSS variables
    displayName: 'Toulouse Lautrec Theme',
    description: 'Tema generado automáticamente desde el Design System',
    version: '1.0.0',
    author: 'Design System Generator'
  },

  // Estructura de directorios
  paths: {
    src: './src',
    output: './wordpress-output',
    components: './src/components',
    assets: {
      css: 'assets/css',
      js: 'assets/js', 
      img: 'assets/img',
      fonts: 'assets/fonts'
    },
    wordpress: {
      components: 'components',
      templates: 'templates',
      includes: 'inc'
    }
  },

  // Configuración de assets
  assets: {
    // Configuración CSS
    css: {
      designTokens: 'design-tokens.css',
      mainPrefix: 'toulouse-design-system', // Este debería ser dinámico
      optimize: true,
      minify: true
    },
    
    // Configuración JavaScript  
    js: {
      mainPrefix: 'toulouse-ds', // Este debería ser dinámico
      formats: ['es', 'umd'],
      optimize: true,
      minify: true
    }
  },

  // Configuración de funciones PHP
  php: {
    functionPrefix: 'toulouse', // Este debería ser dinámico
    hookPrefix: 'toulouse',
    enqueueHandle: 'toulouse',
    textDomain: 'toulouse-lautrec'
  },

  // Configuración de custom post types
  postTypes: {
    enabled: true,
    metadataSource: 'src/component-metadata.json'
  },

  // Configuración SEO
  seo: {
    enabled: true,
    siteName: 'Toulouse Lautrec',
    defaultTitle: 'Toulouse Lautrec',
    defaultDescription: 'Instituto de educación superior especializado en diseño, tecnología y creatividad.'
  },

  // Configuración Analytics
  analytics: {
    enabled: true,
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX', // Cambiar por ID real
      enabled: true
    },
    facebookPixel: {
      pixelId: '',
      enabled: false
    },
    customEvents: {
      pageViews: true,
      componentViews: true,
      interactions: true
    }
  },

  // Configuración de validación
  validation: {
    php: {
      enabled: true,
      strict: true
    },
    rollback: {
      enabled: true,
      cleanOnError: true
    }
  },

  // Variables de entorno y detección automática
  detection: {
    // Detectar automáticamente desde package.json
    autoDetectFromPackage: true,
    // Usar variables de entorno si están disponibles
    useEnvVars: true
  }
};