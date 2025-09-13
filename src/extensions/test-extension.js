/**
 * Test Extension - Validación del Sistema de Extensiones
 */

module.exports = function(config) {
  return {
    name: 'test-extension',
    
    hooks: {
      beforeComponentRender: (component, context) => {
        console.log(`🧩 [Test Extension] ANTES de renderizar: ${component.name}`);
        return { component, context };
      },
      
      afterComponentRender: (component, context, result) => {
        console.log(`🧩 [Test Extension] DESPUÉS de renderizar: ${component.name}`);
        
        // Agregar un comentario de prueba al resultado sin romper el código
        if (result && typeof result === 'string') {
          const modifiedResult = result.replace(
            '<?php\n', 
            `<?php
// ✅ GENERADO CON TEST EXTENSION - SISTEMA FUNCIONANDO
`
          );
          return modifiedResult;
        }
        
        return result;
      },
      
      beforeTemplateGeneration: (templateName, context) => {
        console.log(`🧩 [Test Extension] ANTES de generar template: ${templateName}`);
        return { templateName, context };
      },
      
      afterTemplateGeneration: (templateName, context, result) => {
        console.log(`🧩 [Test Extension] DESPUÉS de generar template: ${templateName}`);
        return result;
      }
    },
    
    componentTypes: {
      'test-component': {
        render: (props, context) => {
          return `
            <div class="test-extension-component">
              <h3>🧩 Componente de Test Extension</h3>
              <p>Extension funcionando correctamente!</p>
            </div>
          `;
        }
      }
    }
  };
};