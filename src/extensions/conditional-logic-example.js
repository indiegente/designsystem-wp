/**
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
          
          <?php if (${conditions.userRole} === 'administrator'): ?>
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
        `;
      }
    }
  };
};