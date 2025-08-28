# 🧩 Guía de Extensiones del Design System

Esta guía explica cómo extender el sistema de generación de WordPress sin modificar la base generada automáticamente.

## 📋 Tabla de Contenidos

- [🏗️ Arquitectura de Extensiones](#️-arquitectura-de-extensiones)
- [🚀 Crear tu Primera Extensión](#-crear-tu-primera-extensión)
- [🔧 Hooks Disponibles](#-hooks-disponibles)
- [🎯 Tipos de Componentes Personalizados](#-tipos-de-componentes-personalizados)
- [📝 Templates Personalizados](#-templates-personalizados)
- [🪝 Hooks Personalizados](#-hooks-personalizados)
- [⚡ Casos de Uso Avanzados](#-casos-de-uso-avanzados)
- [🛠️ Debugging y Testing](#️-debugging-y-testing)
- [📚 Ejemplos Completos](#-ejemplos-completos)

## 🏗️ Arquitectura de Extensiones

### Estructura de Archivos

```
src/
├── extensions/                    # Carpeta de extensiones
│   ├── mi-extension.js           # Tu extensión
│   ├── dynamic-components.js     # Componentes dinámicos
│   ├── events-and-interactions.js # Eventos e interacciones
│   └── README.md                 # Documentación local
├── components/                   # Componentes Lit
└── component-metadata.json       # Metadata de componentes
```

### Flujo de Carga

1. **Detección**: El sistema busca archivos `.js` en `src/extensions/`
2. **Carga**: Cada archivo se carga como módulo Node.js
3. **Registro**: Los hooks y tipos se registran automáticamente
4. **Ejecución**: Se ejecutan en puntos específicos del proceso de generación

## 🚀 Crear tu Primera Extensión

### Paso 1: Crear el archivo

```bash
touch src/extensions/mi-primera-extension.js
```

### Paso 2: Estructura básica

```javascript
/**
 * Mi Primera Extensión
 * 
 * Esta extensión demuestra cómo agregar funcionalidades
 * sin modificar la base generada automáticamente.
 */

module.exports = function(config) {
  return {
    // Nombre único de la extensión
    name: 'mi-primera-extension',
    
    // Hooks que se ejecutan en diferentes puntos
    hooks: {
      // Se ejecuta antes de renderizar cada componente
      beforeComponentRender: async function(component, context) {
        console.log('🔧 Preparando componente:', component.name);
        
        // Agregar datos al contexto
        context.miDato = 'valor personalizado';
      },

      // Se ejecuta después de renderizar cada componente
      afterComponentRender: async function(component, context, result) {
        // Modificar el resultado del renderizado
        if (component.name === 'hero-section') {
          result += `
          <script>
          console.log('Hero section renderizado con extensión');
          </script>`;
        }
        
        return result;
      }
    }
  };
};
```

### Paso 3: Probar la extensión

```bash
npm run wp:generate
```

## 🔧 Hooks Disponibles

### beforeComponentRender(component, context)

Se ejecuta antes de renderizar cada componente.

**Parámetros:**
- `component`: Objeto del componente con propiedades y metadata
- `context`: Contexto compartido entre hooks

**Uso:**
```javascript
beforeComponentRender: async function(component, context) {
  // Validar datos del componente
  if (component.dataSource && !component.dataSource.query) {
    console.warn('Componente sin query definida:', component.name);
  }
  
  // Agregar datos al contexto
  context.timestamp = new Date().toISOString();
}
```

### afterComponentRender(component, context, result)

Se ejecuta después de renderizar cada componente. Puedes modificar el resultado.

**Parámetros:**
- `component`: Objeto del componente
- `context`: Contexto compartido
- `result`: Código PHP generado

**Uso:**
```javascript
afterComponentRender: async function(component, context, result) {
  // Agregar JavaScript para funcionalidad dinámica
  if (component.name === 'testimonials') {
    result += `
    <script>
    // Inicializar testimonials dinámicos
    document.addEventListener('DOMContentLoaded', function() {
      initializeTestimonials();
    });
    </script>`;
  }
  
  return result;
}
```

### beforeTemplateGeneration(templateName, context)

Se ejecuta antes de generar una plantilla de página.

**Uso:**
```javascript
beforeTemplateGeneration: async function(templateName, context) {
  // Preparar datos específicos para la plantilla
  if (templateName === 'page-carreras') {
    context.carrerasData = await fetchCarrerasData();
  }
}
```

### afterTemplateGeneration(templateName, context, result)

Se ejecuta después de generar una plantilla. Puedes modificar el resultado.

**Uso:**
```javascript
afterTemplateGeneration: async function(templateName, context, result) {
  // Agregar meta tags personalizados
  if (templateName === 'page-carreras') {
    result = result.replace(
      '</head>',
      '<meta name="custom-extension" content="true">\n</head>'
    );
  }
  
  return result;
}
```

## 🎯 Tipos de Componentes Personalizados

Puedes definir nuevos tipos de componentes que van más allá de `static`, `iterative` y `aggregated`.

### Ejemplo: Componente Interactivo

```javascript
module.exports = function(config) {
  return {
    name: 'interactive-components',
    
    componentTypes: {
      'interactive': {
        generateCode: function(component, metadata, dataSource) {
          // Lógica para generar componentes interactivos
          return `
          // Código PHP para componente interactivo
          $items = get_posts(array('post_type' => '${dataSource.postType}'));
          $interactive_data = array();
          
          foreach ($items as $item) {
            setup_postdata($item);
            $interactive_data[] = array(
              'id' => get_the_ID(),
              'title' => get_the_title(),
              'content' => get_the_content(),
              'interactive_props' => get_post_meta(get_the_ID(), 'interactive_props', true)
            );
          }
          wp_reset_postdata();
          
          render_${component.name.replace('-', '_')}($interactive_data);
          `;
        }
      }
    }
  };
};
```

### Ejemplo: Componente con Estado

```javascript
componentTypes: {
  'stateful': {
    generateCode: function(component, metadata, dataSource) {
      return `
      // Componente con estado persistente
      $state_key = '${component.name}_state';
      $current_state = get_transient($state_key) ?: array();
      
      // Actualizar estado basado en datos
      $new_state = array_merge($current_state, array(
        'last_updated' => current_time('mysql'),
        'data_count' => count(get_posts(array('post_type' => '${dataSource.postType}')))
      ));
      
      set_transient($state_key, $new_state, HOUR_IN_SECONDS);
      
      render_${component.name.replace('-', '_')}($new_state);
      `;
    }
  }
}
```

## 📝 Templates Personalizados

Puedes definir templates PHP personalizados que se usan en lugar de los generados automáticamente.

### Ejemplo: Template con Lógica Condicional

```javascript
module.exports = function(config) {
  return {
    name: 'conditional-templates',
    
    templates: {
      'conditional-template': function(componentName, props, conditions) {
        return `
        <div class="${componentName}-conditional">
          <?php if (${conditions.isLoggedIn}): ?>
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
        </div>
        `;
      }
    }
  };
};
```

### Ejemplo: Template con A/B Testing

```javascript
templates: {
  'ab-test-template': function(componentName, props) {
    return `
    <div class="${componentName}-ab-test">
      <?php
      $variant = wp_rand(1, 2) === 1 ? 'a' : 'b';
      $variant_class = 'variant-' . $variant;
      ?>
      
      <div class="${componentName} ${variant_class}">
        <?php if ($variant === 'a'): ?>
          <!-- Variante A -->
          <h2><?php echo esc_html($title); ?></h2>
          <p><?php echo esc_html($subtitle); ?></p>
        <?php else: ?>
          <!-- Variante B -->
          <h1><?php echo esc_html($title); ?></h1>
          <h3><?php echo esc_html($subtitle); ?></h3>
        <?php endif; ?>
      </div>
      
      <script>
      // Analytics para A/B testing
      gtag('event', 'ab_test_view', {
        'event_category': '${componentName}',
        'event_label': 'variant_${variant}'
      });
      </script>
    </div>
    `;
  }
}
```

## 🪝 Hooks Personalizados

Puedes definir hooks personalizados que otros desarrolladores pueden usar.

### Ejemplo: Hook para Analytics

```javascript
module.exports = function(config) {
  return {
    name: 'analytics-hooks',
    
    customHooks: {
      'trackComponentView': async function(componentName, data) {
        return `
        <script>
        // Analytics automático para ${componentName}
        gtag('event', 'component_view', {
          'event_category': '${componentName}',
          'event_label': '${data.label || 'default'}',
          'custom_parameter': '${data.custom || ''}'
        });
        </script>
        `;
      },
      
      'trackUserInteraction': async function(componentName, interactionType) {
        return `
        <script>
        document.addEventListener('DOMContentLoaded', function() {
          const component = document.querySelector('.${componentName}');
          if (component) {
            component.addEventListener('${interactionType}', function() {
              gtag('event', 'user_interaction', {
                'event_category': '${componentName}',
                'event_label': '${interactionType}'
              });
            });
          }
        });
        </script>
        `;
      }
    }
  };
};
```

### Uso de Hooks Personalizados

```javascript
// En otra extensión
module.exports = function(config) {
  return {
    name: 'mi-extension-que-usa-hooks',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        // Usar hook personalizado
        const analyticsScript = await this.extensionManager.executeCustomHook(
          'trackComponentView', 
          component.name, 
          { label: 'custom_label' }
        );
        
        if (analyticsScript) {
          result += analyticsScript;
        }
        
        return result;
      }
    }
  };
};
```

## ⚡ Casos de Uso Avanzados

### 1. Componentes con Estado Dinámico

```javascript
module.exports = function(config) {
  return {
    name: 'dynamic-state-components',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        if (component.name === 'testimonials') {
          // Obtener datos dinámicos de una API externa
          context.dynamicTestimonials = await fetchExternalTestimonials();
        }
      },
      
      afterComponentRender: async function(component, context, result) {
        if (component.name === 'testimonials' && context.dynamicTestimonials) {
          result += `
          <script>
          // Inicializar testimonials dinámicos
          window.dynamicTestimonials = ${JSON.stringify(context.dynamicTestimonials)};
          
          function initializeDynamicTestimonials() {
            const container = document.querySelector('.testimonials-grid');
            if (container && window.dynamicTestimonials) {
              window.dynamicTestimonials.forEach(testimonial => {
                // Agregar testimonials dinámicamente
                const element = createTestimonialElement(testimonial);
                container.appendChild(element);
              });
            }
          }
          
          document.addEventListener('DOMContentLoaded', initializeDynamicTestimonials);
          </script>`;
        }
        
        return result;
      }
    },
    
    customHooks: {
      'fetchExternalTestimonials': async function() {
        // Simular llamada a API externa
        return [
          { name: 'Usuario Externo 1', content: 'Contenido dinámico 1' },
          { name: 'Usuario Externo 2', content: 'Contenido dinámico 2' }
        ];
      }
    }
  };
};
```

### 2. Validación de Formularios

```javascript
module.exports = function(config) {
  return {
    name: 'form-validation',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        if (component.name === 'contact-form') {
          result += `
          <script>
          // Validación de formulario
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.querySelector('.contact-form');
            if (form) {
              form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = form.querySelector('input[type="email"]').value;
                const message = form.querySelector('textarea').value;
                
                if (!email || !message) {
                  alert('Por favor completa todos los campos');
                  return;
                }
                
                if (!isValidEmail(email)) {
                  alert('Por favor ingresa un email válido');
                  return;
                }
                
                // Enviar formulario
                submitForm(form);
              });
            }
          });
          
          function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          }
          
          function submitForm(form) {
            // Lógica de envío
            console.log('Formulario enviado');
          }
          </script>`;
        }
        
        return result;
      }
    }
  };
};
```

### 3. Lazy Loading de Componentes

```javascript
module.exports = function(config) {
  return {
    name: 'lazy-loading',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        // Agregar lazy loading a componentes pesados
        if (component.name === 'image-gallery' || component.name === 'video-player') {
          result = result.replace(
            'class="component"',
            'class="component lazy-load" data-src="true"'
          );
          
          result += `
          <script>
          // Lazy loading
          document.addEventListener('DOMContentLoaded', function() {
            const lazyElements = document.querySelectorAll('.lazy-load');
            
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.remove('lazy-load');
                  entry.target.classList.add('loaded');
                  observer.unobserve(entry.target);
                }
              });
            });
            
            lazyElements.forEach(element => {
              observer.observe(element);
            });
          });
          </script>`;
        }
        
        return result;
      }
    }
  };
};
```

## 🛠️ Debugging y Testing

### Logs de Debugging

```javascript
module.exports = function(config) {
  return {
    name: 'debug-extension',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        console.log('🔍 Debug - Componente:', component.name);
        console.log('🔍 Debug - Props:', component.props);
        console.log('🔍 Debug - DataSource:', component.dataSource);
      },
      
      afterComponentRender: async function(component, context, result) {
        console.log('🔍 Debug - Resultado generado para:', component.name);
        console.log('🔍 Debug - Longitud del resultado:', result.length);
        
        return result;
      }
    }
  };
};
```

### Testing de Extensiones

```javascript
// test-extension.js
module.exports = function(config) {
  return {
    name: 'test-extension',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        // Verificar que el resultado contiene elementos esperados
        if (component.name === 'testimonials') {
          if (!result.includes('testimonial-card')) {
            console.error('❌ Test falló: No se encontró testimonial-card');
          } else {
            console.log('✅ Test pasó: testimonial-card encontrado');
          }
        }
        
        return result;
      }
    }
  };
};
```

### Validación de Extensiones

```javascript
// validation-extension.js
module.exports = function(config) {
  return {
    name: 'validation-extension',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        // Validar metadata del componente
        if (!component.name) {
          throw new Error('Componente sin nombre definido');
        }
        
        if (component.dataSource && !component.dataSource.type) {
          console.warn('⚠️ DataSource sin tipo definido para:', component.name);
        }
      },
      
      afterComponentRender: async function(component, context, result) {
        // Validar resultado generado
        if (!result || result.length === 0) {
          throw new Error(`Resultado vacío para componente: ${component.name}`);
        }
        
        if (!result.includes('<?php')) {
          console.warn('⚠️ Resultado no contiene código PHP para:', component.name);
        }
        
        return result;
      }
    }
  };
};
```

## 📚 Ejemplos Completos

### Extensión Completa: Analytics Avanzado

```javascript
/**
 * Extensión de Analytics Avanzado
 * 
 * Agrega tracking automático para todos los componentes
 * con métricas personalizadas y eventos de usuario.
 */

module.exports = function(config) {
  return {
    name: 'advanced-analytics',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        // Preparar datos de analytics
        context.analyticsData = {
          componentName: component.name,
          timestamp: new Date().toISOString(),
          userAgent: '<?php echo $_SERVER["HTTP_USER_AGENT"] ?? "unknown"; ?>',
          pageUrl: '<?php echo get_permalink(); ?>'
        };
      },
      
      afterComponentRender: async function(component, context, result) {
        // Agregar tracking automático
        const analyticsScript = this.generateAnalyticsScript(component, context.analyticsData);
        result += analyticsScript;
        
        return result;
      }
    },
    
    // Métodos de la extensión
    generateAnalyticsScript: function(component, analyticsData) {
      return `
      <script>
      // Analytics automático para ${component.name}
      document.addEventListener('DOMContentLoaded', function() {
        // Page view tracking
        gtag('event', 'component_view', {
          'event_category': '${component.name}',
          'event_label': '${analyticsData.pageUrl}',
          'custom_map': {
            'custom_parameter_1': 'component_name',
            'custom_parameter_2': 'timestamp'
          },
          'component_name': '${component.name}',
          'timestamp': '${analyticsData.timestamp}'
        });
        
        // User interaction tracking
        const component = document.querySelector('.${component.name}');
        if (component) {
          // Track clicks
          component.addEventListener('click', function(e) {
            gtag('event', 'component_click', {
              'event_category': '${component.name}',
              'event_label': e.target.tagName.toLowerCase()
            });
          });
          
          // Track scroll into view
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                gtag('event', 'component_visible', {
                  'event_category': '${component.name}',
                  'event_label': 'scroll_into_view'
                });
                observer.unobserve(entry.target);
              }
            });
          });
          
          observer.observe(component);
        }
      });
      </script>`;
    },
    
    customHooks: {
      'trackCustomEvent': async function(eventName, parameters) {
        return `
        <script>
        gtag('event', '${eventName}', ${JSON.stringify(parameters)});
        </script>`;
      }
    }
  };
};
```

### Extensión Completa: Optimización de Performance

```javascript
/**
 * Extensión de Optimización de Performance
 * 
 * Agrega optimizaciones automáticas como lazy loading,
 * preloading de recursos críticos y compresión de imágenes.
 */

module.exports = function(config) {
  return {
    name: 'performance-optimization',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        // Analizar componente para optimizaciones
        context.optimizations = this.analyzeComponent(component);
      },
      
      afterComponentRender: async function(component, context, result) {
        // Aplicar optimizaciones
        if (context.optimizations.lazyLoad) {
          result = this.applyLazyLoading(result, component.name);
        }
        
        if (context.optimizations.preload) {
          result = this.applyPreloading(result, component.name);
        }
        
        return result;
      }
    },
    
    analyzeComponent: function(component) {
      const optimizations = {
        lazyLoad: false,
        preload: false,
        compress: false
      };
      
      // Determinar optimizaciones basadas en el tipo de componente
      if (component.name.includes('gallery') || component.name.includes('image')) {
        optimizations.lazyLoad = true;
        optimizations.compress = true;
      }
      
      if (component.name.includes('hero') || component.name.includes('banner')) {
        optimizations.preload = true;
      }
      
      return optimizations;
    },
    
    applyLazyLoading: function(result, componentName) {
      return result.replace(
        /<img([^>]+)>/g,
        '<img$1 loading="lazy" decoding="async">'
      );
    },
    
    applyPreloading: function(result, componentName) {
      return result.replace(
        '</head>',
        `<link rel="preload" href="/assets/css/${componentName}.css" as="style">
        <link rel="preload" href="/assets/js/${componentName}.js" as="script">
        </head>`
      );
    },
    
    customHooks: {
      'optimizeImages': async function(imageUrls) {
        return `
        <script>
        // Optimización automática de imágenes
        document.addEventListener('DOMContentLoaded', function() {
          const images = document.querySelectorAll('img[data-src]');
          images.forEach(img => {
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  img.src = img.dataset.src;
                  img.classList.remove('lazy');
                  observer.unobserve(img);
                }
              });
            });
            observer.observe(img);
          });
        });
        </script>`;
      }
    }
  };
};
```

## 🎯 Mejores Prácticas

### 1. **Nomenclatura Consistente**
```javascript
// ✅ Bueno
name: 'my-extension-name'

// ❌ Malo
name: 'MyExtensionName'
```

### 2. **Manejo de Errores**
```javascript
hooks: {
  afterComponentRender: async function(component, context, result) {
    try {
      // Tu lógica aquí
      return modifiedResult;
    } catch (error) {
      console.error('Error en extensión:', error.message);
      return result; // Retornar resultado original en caso de error
    }
  }
}
```

### 3. **Documentación**
```javascript
/**
 * Mi Extensión
 * 
 * Propósito: Agregar funcionalidad X a componentes Y
 * Autor: Tu Nombre
 * Fecha: 2024-01-01
 * 
 * Hooks utilizados:
 * - beforeComponentRender: Para preparar datos
 * - afterComponentRender: Para modificar resultado
 * 
 * Ejemplo de uso:
 * 1. Colocar archivo en src/extensions/
 * 2. Ejecutar npm run wp:generate
 * 3. Verificar logs para confirmar carga
 */
```

### 4. **Testing**
```javascript
// Siempre incluir logs para debugging
console.log('🔧 Extensión cargada:', this.name);
console.log('🔧 Hooks registrados:', Object.keys(this.hooks));
```

### 5. **Performance**
```javascript
// Evitar operaciones costosas en hooks frecuentes
hooks: {
  beforeComponentRender: async function(component, context) {
    // ✅ Cachear resultados
    if (!context.cachedData) {
      context.cachedData = await expensiveOperation();
    }
  }
}
```

## 🚀 Próximos Pasos

1. **Explora los ejemplos** en `src/extensions/`
2. **Crea tu primera extensión** siguiendo esta guía
3. **Comparte tus extensiones** con el equipo
4. **Documenta patrones** que encuentres útiles
5. **Contribuye** a mejorar el sistema de extensiones

---

**¿Necesitas ayuda?** Revisa los ejemplos incluidos o consulta con el equipo de desarrollo.
