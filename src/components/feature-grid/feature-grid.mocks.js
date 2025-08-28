/**
 * Datos de ejemplo para Feature Grid
 * Los desarrolladores pueden personalizar estos valores para sus stories
 */

module.exports = {
  // Valores por defecto para las properties
  defaultArgs: {
    title: 'Nuestras Características Principales',
    subtitle: 'Descubre todo lo que podemos ofrecerte',
    features: [
      {
        title: 'Diseño Responsivo',
        description: 'Se adapta perfectamente a cualquier dispositivo y tamaño de pantalla',
        icon: '📱'
      },
      {
        title: 'Alto Rendimiento',
        description: 'Optimizado para cargar rápidamente y ofrecer la mejor experiencia',
        icon: '⚡'
      },
      {
        title: 'Fácil de Usar',
        description: 'Interfaz intuitiva diseñada pensando en la experiencia del usuario',
        icon: '🎨'
      },
      {
        title: 'Seguridad Avanzada',
        description: 'Protección robusta para mantener tus datos seguros',
        icon: '🔒'
      }
    ]
  },

  // Variantes adicionales que se pueden usar en stories
  variants: {
    minimal: {
      title: 'Características Básicas',
      subtitle: 'Lo esencial que necesitas saber',
      features: [
        {
          title: 'Simple',
          description: 'Fácil de entender',
          icon: '✨'
        },
        {
          title: 'Eficaz',
          description: 'Resultados garantizados',
          icon: '🎯'
        }
      ]
    },

    extensive: {
      title: 'Todas Nuestras Características',
      subtitle: 'Una lista completa de lo que ofrecemos',
      features: [
        {
          title: 'Desarrollo Ágil',
          description: 'Metodologías modernas para entregas rápidas',
          icon: '🚀'
        },
        {
          title: 'Soporte 24/7',
          description: 'Estamos aquí cuando nos necesites',
          icon: '🆘'
        },
        {
          title: 'Escalabilidad',
          description: 'Crece con tu negocio sin limitaciones',
          icon: '📈'
        },
        {
          title: 'Integración API',
          description: 'Conecta con tus herramientas favoritas',
          icon: '🔗'
        },
        {
          title: 'Analytics Avanzado',
          description: 'Insights profundos para tomar mejores decisiones',
          icon: '📊'
        },
        {
          title: 'Personalización',
          description: 'Adapta todo según tus necesidades específicas',
          icon: '⚙️'
        }
      ]
    },

    empty: {
      title: 'Características',
      subtitle: 'Cargando...',
      features: []
    }
  }
};