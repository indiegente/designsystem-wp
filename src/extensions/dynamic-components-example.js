/**
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
          result += `
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
          </script>`;
        }
        
        return result;
      }
    },

    // Tipos de componentes personalizados
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
    },

    // Templates personalizados
    templates: {
      'interactive-template': function(componentName, props) {
        return `
        <div class="${componentName}-interactive" data-component="${componentName}">
          <div class="interactive-content">
            <?php foreach ($items as $item): ?>
              <div class="interactive-item" data-id="${item['id']}">
                <h3>${item['title']}</h3>
                <div class="interactive-controls">
                  <button class="btn-toggle" onclick="toggleItem(${item['id']})">
                    Toggle
                  </button>
                </div>
                <div class="interactive-content" style="display: none;">
                  ${item['content']}
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        </div>
        
        <script>
        function toggleItem(id) {
          const item = document.querySelector(`[data-id="${id}"]`);
          const content = item.querySelector('.interactive-content');
          content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
        </script>
        `;
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
};