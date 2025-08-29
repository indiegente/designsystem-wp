const fs = require('fs');
const path = require('path');

/**
 * ExtensionManager - Gestor de extensiones para el generador WordPress
 * 
 * Permite a los desarrolladores agregar funcionalidades avanzadas sin modificar
 * la base generada automáticamente. Las extensiones se cargan desde la carpeta
 * `extensions/` y se aplican en puntos específicos del proceso de generación.
 */
class ExtensionManager {
  constructor(config) {
    this.config = config;
    this.extensions = this.loadExtensions();
    this.hooks = {
      beforeComponentRender: [],
      afterComponentRender: [],
      beforeTemplateGeneration: [],
      afterTemplateGeneration: [],
      beforeAssetGeneration: [],
      afterAssetGeneration: [],
      customComponentTypes: new Map(),
      customTemplates: new Map(),
      customHooks: new Map()
    };
  }

  /**
   * Carga todas las extensiones desde la carpeta extensions/
   */
  loadExtensions() {
    const extensionsDir = path.join(this.config.srcDir, 'extensions');
    
    if (!fs.existsSync(extensionsDir)) {
      console.log('📁 No se encontró carpeta de extensiones - continuando sin extensiones');
      return [];
    }

    const extensions = [];
    const extensionFiles = fs.readdirSync(extensionsDir).filter(file => 
      file.endsWith('.js') && !file.includes('example')
    );

    for (const file of extensionFiles) {
      try {
        const extensionPath = path.resolve(extensionsDir, file);
        delete require.cache[extensionPath]; // Limpiar cache para recargas
        const extension = require(extensionPath);
        
        if (typeof extension === 'function') {
          const extensionInstance = extension(this.config);
          extensions.push(extensionInstance);
          this.registerExtension(extensionInstance);
        } else if (extension && typeof extension.register === 'function') {
          extensions.push(extension);
          this.registerExtension(extension);
        }
        
        console.log(`✅ Extensión cargada: ${file}`);
      } catch (error) {
        // FAIL FAST - No permitir extensiones con errores
        throw new Error(`❌ EXTENSIÓN CON ERRORES: ${file}\n💡 Error: ${error.message}\n💡 Ubicación: ${path.join(extensionsDir, file)}\n💡 Solución: Corregir sintaxis o eliminar archivo`);
      }
    }

    return extensions;
  }

  /**
   * Registra una extensión y sus hooks
   */
  registerExtension(extension) {
    if (extension.hooks) {
      Object.keys(extension.hooks).forEach(hookName => {
        if (this.hooks[hookName]) {
          if (Array.isArray(this.hooks[hookName])) {
            this.hooks[hookName].push(extension.hooks[hookName]);
          } else if (this.hooks[hookName] instanceof Map) {
            this.hooks[hookName].set(extension.name || 'anonymous', extension.hooks[hookName]);
          }
        }
      });
    }

    // Registrar tipos de componentes personalizados
    if (extension.componentTypes) {
      Object.keys(extension.componentTypes).forEach(typeName => {
        this.hooks.customComponentTypes.set(typeName, extension.componentTypes[typeName]);
      });
    }

    // Registrar templates personalizados
    if (extension.templates) {
      Object.keys(extension.templates).forEach(templateName => {
        this.hooks.customTemplates.set(templateName, extension.templates[templateName]);
      });
    }

    // Registrar hooks personalizados
    if (extension.customHooks) {
      Object.keys(extension.customHooks).forEach(hookName => {
        this.hooks.customHooks.set(hookName, extension.customHooks[hookName]);
      });
    }
  }

  /**
   * Ejecuta hooks antes del renderizado de componentes
   */
  async executeBeforeComponentRender(component, context) {
    for (const hook of this.hooks.beforeComponentRender) {
      try {
        await hook(component, context);
      } catch (error) {
        console.error('❌ Error en hook beforeComponentRender:', error.message);
      }
    }
  }

  /**
   * Ejecuta hooks después del renderizado de componentes
   */
  async executeAfterComponentRender(component, context, result) {
    for (const hook of this.hooks.afterComponentRender) {
      try {
        const modifiedResult = await hook(component, context, result);
        if (modifiedResult) {
          result = modifiedResult;
        }
      } catch (error) {
        console.error('❌ Error en hook afterComponentRender:', error.message);
      }
    }
    return result;
  }

  /**
   * Ejecuta hooks antes de la generación de templates
   */
  async executeBeforeTemplateGeneration(templateName, context) {
    for (const hook of this.hooks.beforeTemplateGeneration) {
      try {
        await hook(templateName, context);
      } catch (error) {
        console.error('❌ Error en hook beforeTemplateGeneration:', error.message);
      }
    }
  }

  /**
   * Ejecuta hooks después de la generación de templates
   */
  async executeAfterTemplateGeneration(templateName, context, result) {
    for (const hook of this.hooks.afterTemplateGeneration) {
      try {
        const modifiedResult = await hook(templateName, context, result);
        if (modifiedResult) {
          result = modifiedResult;
        }
      } catch (error) {
        console.error('❌ Error en hook afterTemplateGeneration:', error.message);
      }
    }
    return result;
  }

  /**
   * Obtiene un tipo de componente personalizado
   */
  getCustomComponentType(typeName) {
    return this.hooks.customComponentTypes.get(typeName);
  }

  /**
   * Obtiene un template personalizado
   */
  getCustomTemplate(templateName) {
    return this.hooks.customTemplates.get(templateName);
  }

  /**
   * Ejecuta un hook personalizado
   */
  async executeCustomHook(hookName, ...args) {
    const hook = this.hooks.customHooks.get(hookName);
    if (hook) {
      try {
        return await hook(...args);
      } catch (error) {
        console.error(`❌ Error en hook personalizado ${hookName}:`, error.message);
      }
    }
    return null;
  }

  /**
   * Crea ejemplos de extensiones para que los desarrolladores tengan una base
   */
  createExtensionExamples(extensionsDir) {
    // Ejemplo de extensión para componentes dinámicos
    const dynamicComponentsExample = `/**
 * Ejemplo de extensión para componentes dinámicos
 * 
 * Esta extensión demuestra cómo agregar funcionalidades avanzadas
 * como estado dinámico, eventos de usuario y lógica condicional
 * sin modificar la base generada automáticamente.
 */

module.exports = function(config) {
  return {
    name: 'dynamic-components-extension',
    
    // Hooks que se ejecutan en diferentes puntos del proceso
    hooks: {
      // Hook que se ejecuta antes del renderizado de componentes
      beforeComponentRender: async function(component, context) {
        // Aquí puedes agregar lógica antes de renderizar un componente
        // Por ejemplo, validar datos, preparar contexto, etc.
        console.log('🔧 Preparando componente:', component.name);
        
        // Ejemplo: Agregar datos dinámicos al contexto
        if (component.name === 'testimonials') {
          context.dynamicData = await this.fetchDynamicTestimonials();
        }
      },

      // Hook que se ejecuta después del renderizado de componentes
      afterComponentRender: async function(component, context, result) {
        // Aquí puedes modificar el resultado del renderizado
        // Por ejemplo, agregar JavaScript, estilos adicionales, etc.
        
        if (component.name === 'testimonials' && context.dynamicData) {
          // Agregar JavaScript para funcionalidad dinámica
          result += \`
          <script>
          // JavaScript generado por extensión
          document.addEventListener('DOMContentLoaded', function() {
            // Inicializar funcionalidad dinámica para testimonials
            initializeTestimonialsDynamic();
          });
          
          function initializeTestimonialsDynamic() {
            // Lógica para funcionalidad dinámica
            console.log('Testimonials dinámicos inicializados');
          }
          </script>\`;
        }
        
        return result;
      }
    },

    // Tipos de componentes personalizados
    componentTypes: {
      'interactive': {
        generateCode: function(component, metadata, dataSource) {
          // Lógica para generar componentes interactivos
          return \`
          // Código PHP para componente interactivo
          \$items = get_posts(array('post_type' => '\${dataSource.postType}'));
          \$interactive_data = array();
          
          foreach (\$items as \$item) {
            setup_postdata(\$item);
            \$interactive_data[] = array(
              'id' => get_the_ID(),
              'title' => get_the_title(),
              'content' => get_the_content(),
              'interactive_props' => get_post_meta(get_the_ID(), 'interactive_props', true)
            );
          }
          wp_reset_postdata();
          
          render_\${component.name.replace('-', '_')}(\$interactive_data);
          \`;
        }
      }
    },

    // Templates personalizados
    templates: {
      'interactive-template': function(componentName, props) {
        return \`
        <div class="\${componentName}-interactive" data-component="\${componentName}">
          <div class="interactive-content">
            <?php foreach (\$items as \$item): ?>
              <div class="interactive-item" data-id="\${item['id']}">
                <h3>\${item['title']}</h3>
                <div class="interactive-controls">
                  <button class="btn-toggle" onclick="toggleItem(\${item['id']})">
                    Toggle
                  </button>
                </div>
                <div class="interactive-content" style="display: none;">
                  \${item['content']}
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        </div>
        
        <script>
        function toggleItem(id) {
          const item = document.querySelector(\`[data-id="\${id}"]\`);
          const content = item.querySelector('.interactive-content');
          content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
        </script>
        \`;
      }
    },

    // Hooks personalizados
    customHooks: {
      'fetchDynamicTestimonials': async function() {
        // Ejemplo de hook personalizado para obtener datos dinámicos
        return [
          { id: 1, name: 'Usuario Dinámico 1', content: 'Contenido dinámico 1' },
          { id: 2, name: 'Usuario Dinámico 2', content: 'Contenido dinámico 2' }
        ];
      }
    }
  };
};`;

    // Ejemplo de extensión para eventos y interacciones
    const eventsExtensionExample = `/**
 * Extensión para manejo de eventos y interacciones de usuario
 * 
 * Esta extensión agrega funcionalidades para:
 * - Eventos de click, hover, scroll
 * - Validación de formularios
 * - Animaciones y transiciones
 * - Integración con analytics
 */

module.exports = function(config) {
  return {
    name: 'events-and-interactions',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        // Agregar JavaScript para eventos según el tipo de componente
        let eventScript = '';
        
        switch (component.name) {
          case 'hero-section':
            eventScript = this.generateHeroEvents(component);
            break;
          case 'course-card':
            eventScript = this.generateCourseCardEvents(component);
            break;
          case 'testimonials':
            eventScript = this.generateTestimonialsEvents(component);
            break;
        }
        
        if (eventScript) {
          result += \`<script>\${eventScript}</script>\`;
        }
        
        return result;
      }
    },

    // Métodos para generar eventos específicos
    generateHeroEvents: function(component) {
      return \`
      // Eventos para hero-section
      document.addEventListener('DOMContentLoaded', function() {
        const heroCta = document.querySelector('.hero-cta');
        if (heroCta) {
          heroCta.addEventListener('click', function(e) {
            // Analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'click', {
                'event_category': 'engagement',
                'event_label': 'hero_cta_click'
              });
            }
            
            // Lógica adicional
            console.log('Hero CTA clicked');
          });
        }
      });
      \`;
    },

    generateCourseCardEvents: function(component) {
      return \`
      // Eventos para course-card
      document.addEventListener('DOMContentLoaded', function() {
        const courseCards = document.querySelectorAll('.course-card');
        courseCards.forEach(function(card) {
          // Hover effect
          card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
          });
          
          card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
          });
          
          // Click event
          card.addEventListener('click', function() {
            const link = this.querySelector('a');
            if (link) {
              // Analytics
              if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                  'event_category': 'engagement',
                  'event_label': 'course_card_click'
                });
              }
            }
          });
        });
      });
      \`;
    },

    generateTestimonialsEvents: function(component) {
      return \`
      // Eventos para testimonials
      document.addEventListener('DOMContentLoaded', function() {
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        let currentIndex = 0;
        
        // Auto-rotación de testimonios
        setInterval(function() {
          testimonialCards.forEach(function(card, index) {
            card.style.display = index === currentIndex ? 'block' : 'none';
          });
          
          currentIndex = (currentIndex + 1) % testimonialCards.length;
        }, 5000);
        
        // Eventos de rating
        const ratingStars = document.querySelectorAll('.star');
        ratingStars.forEach(function(star) {
          star.addEventListener('click', function() {
            const rating = this.parentElement.querySelectorAll('.star').length;
            console.log('Rating clicked:', rating);
            
            // Analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'click', {
                'event_category': 'engagement',
                'event_label': 'testimonial_rating'
              });
            }
          });
        });
      });
      \`;
    }
  };
};`;

    // Ejemplo de extensión para lógica condicional
    const conditionalLogicExample = `/**
 * Extensión para lógica condicional avanzada
 * 
 * Esta extensión permite:
 * - Renderizado condicional basado en roles de usuario
 * - Contenido dinámico según estado de la aplicación
 * - Personalización basada en datos de WordPress
 * - A/B testing de componentes
 */

module.exports = function(config) {
  return {
    name: 'conditional-logic',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        // Agregar lógica condicional al contexto
        context.conditionalData = await this.evaluateConditions(component);
      },

      afterComponentRender: async function(component, context, result) {
        // Aplicar lógica condicional al resultado
        if (context.conditionalData) {
          result = this.applyConditionalLogic(result, context.conditionalData);
        }
        return result;
      }
    },

    // Evaluar condiciones para el componente
    evaluateConditions: async function(component) {
      const conditions = {
        userRole: this.getCurrentUserRole(),
        isLoggedIn: is_user_logged_in(),
        currentTime: new Date().getHours(),
        abTest: this.getABTestVariant(component.name)
      };
      
      return conditions;
    },

    // Aplicar lógica condicional al resultado
    applyConditionalLogic: function(result, conditions) {
      let modifiedResult = result;
      
      // Ejemplo: Mostrar contenido diferente según el rol
      if (conditions.userRole === 'administrator') {
        modifiedResult = modifiedResult.replace(
          '<!-- ADMIN_CONTENT -->',
          '<div class="admin-panel">Panel de administrador</div>'
        );
      }
      
      // Ejemplo: A/B testing
      if (conditions.abTest === 'variant_b') {
        modifiedResult = modifiedResult.replace(
          'class="component"',
          'class="component variant-b"'
        );
      }
      
      return modifiedResult;
    },

    // Obtener rol del usuario actual
    getCurrentUserRole: function() {
      // Esta función se ejecutará en el contexto de WordPress
      return '<?php echo current_user_can("administrator") ? "administrator" : "subscriber"; ?>';
    },

    // Obtener variante de A/B testing
    getABTestVariant: function(componentName) {
      // Lógica simple de A/B testing basada en el nombre del componente
      const variants = ['variant_a', 'variant_b'];
      const index = componentName.length % variants.length;
      return variants[index];
    },

    // Templates con lógica condicional
    templates: {
      'conditional-template': function(componentName, props, conditions) {
        return \`
        <div class="\${componentName}-conditional">
          <?php if (\${conditions.isLoggedIn}): ?>
            <div class="logged-in-content">
              <h3>Bienvenido, <?php echo wp_get_current_user()->display_name; ?></h3>
              <!-- Contenido para usuarios logueados -->
            </div>
          <?php else: ?>
            <div class="guest-content">
              <h3>Inicia sesión para ver contenido personalizado</h3>
              <a href="<?php echo wp_login_url(); ?>" class="login-link">Iniciar sesión</a>
            </div>
          <?php endif; ?>
          
          <?php if (\${conditions.userRole} === 'administrator'): ?>
            <div class="admin-content">
              <h4>Panel de administrador</h4>
              <button onclick="showAdminPanel()">Gestionar contenido</button>
            </div>
          <?php endif; ?>
        </div>
        
        <script>
        function showAdminPanel() {
          // Lógica del panel de administrador
          console.log('Mostrando panel de administrador');
        }
        </script>
        \`;
      }
    }
  };
};`;

    // Crear archivos de ejemplo
    fs.writeFileSync(path.join(extensionsDir, 'dynamic-components-example.js'), dynamicComponentsExample);
    fs.writeFileSync(path.join(extensionsDir, 'events-and-interactions-example.js'), eventsExtensionExample);
    fs.writeFileSync(path.join(extensionsDir, 'conditional-logic-example.js'), conditionalLogicExample);

    // Crear README para extensiones
    const extensionsReadme = `# 🧩 Extensiones del Design System

Esta carpeta contiene extensiones que permiten agregar funcionalidades avanzadas al generador de WordPress sin modificar la base generada automáticamente.

## 📁 Estructura

\`\`\`
extensions/
├── dynamic-components-example.js    # Componentes con estado dinámico
├── events-and-interactions-example.js # Eventos y interacciones
├── conditional-logic-example.js     # Lógica condicional
└── README.md                        # Esta documentación
\`\`\`

## 🚀 Cómo crear una extensión

1. **Crear archivo**: Crea un archivo .js en esta carpeta
2. **Exportar función**: Tu extensión debe exportar una función que reciba la configuración
3. **Definir hooks**: Especifica qué hooks quieres usar
4. **Implementar lógica**: Agrega tu funcionalidad personalizada

### Ejemplo básico:

\`\`\`javascript
module.exports = function(config) {
  return {
    name: 'mi-extension',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        // Modificar el resultado del renderizado
        return result + '<script>console.log("Mi extensión funcionó!");</script>';
      }
    }
  };
};
\`\`\`

## 🔧 Hooks disponibles

### beforeComponentRender(component, context)
Se ejecuta antes de renderizar un componente.

### afterComponentRender(component, context, result)
Se ejecuta después de renderizar un componente. Puedes modificar el resultado.

### beforeTemplateGeneration(templateName, context)
Se ejecuta antes de generar una plantilla.

### afterTemplateGeneration(templateName, context, result)
Se ejecuta después de generar una plantilla. Puedes modificar el resultado.

## 🎯 Tipos de componentes personalizados

Puedes definir nuevos tipos de componentes:

\`\`\`javascript
componentTypes: {
  'mi-tipo': {
    generateCode: function(component, metadata, dataSource) {
      // Lógica para generar código PHP
      return '// Tu código PHP personalizado';
    }
  }
}
\`\`\`

## 📝 Templates personalizados

Puedes definir templates personalizados:

\`\`\`javascript
templates: {
  'mi-template': function(componentName, props) {
    return \`
    <div class="\${componentName}-personalizado">
      <!-- Tu HTML personalizado -->
    </div>
    \`;
  }
}
\`\`\`

## 🪝 Hooks personalizados

Puedes definir hooks personalizados:

\`\`\`javascript
customHooks: {
  'mi-hook': async function(...args) {
    // Tu lógica personalizada
    return resultado;
  }
}
\`\`\`

## ⚠️ Buenas prácticas

1. **No modificar la base**: Las extensiones no deben modificar archivos base
2. **Manejo de errores**: Siempre incluye try-catch en tus hooks
3. **Documentación**: Comenta tu código para que otros desarrolladores lo entiendan
4. **Testing**: Prueba tus extensiones antes de usarlas en producción
5. **Performance**: Evita operaciones costosas en hooks que se ejecutan frecuentemente

## 🔍 Debugging

Para debuggear extensiones:

1. Revisa los logs del generador
2. Usa console.log en tus hooks
3. Verifica que los archivos se estén cargando correctamente
4. Comprueba que los hooks se estén ejecutando

## 📚 Ejemplos incluidos

- **dynamic-components-example.js**: Componentes con estado dinámico y eventos
- **events-and-interactions-example.js**: Manejo de eventos de usuario
- **conditional-logic-example.js**: Lógica condicional avanzada

Copia y modifica estos ejemplos para crear tus propias extensiones.
`;

    fs.writeFileSync(path.join(extensionsDir, 'README.md'), extensionsReadme);

    console.log('📁 Ejemplos de extensiones creados en:', extensionsDir);
  }

  /**
   * Obtiene estadísticas de las extensiones cargadas
   */
  getStats() {
    return {
      totalExtensions: this.extensions.length,
      hooks: {
        beforeComponentRender: this.hooks.beforeComponentRender.length,
        afterComponentRender: this.hooks.afterComponentRender.length,
        beforeTemplateGeneration: this.hooks.beforeTemplateGeneration.length,
        afterTemplateGeneration: this.hooks.afterTemplateGeneration.length
      },
      customTypes: this.hooks.customComponentTypes.size,
      customTemplates: this.hooks.customTemplates.size,
      customHooks: this.hooks.customHooks.size
    };
  }
}

module.exports = ExtensionManager;
