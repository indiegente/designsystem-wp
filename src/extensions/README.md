# 🧩 Extensiones del Design System

Esta carpeta contiene extensiones que permiten agregar funcionalidades avanzadas al generador de WordPress sin modificar la base generada automáticamente.

## 📁 Estructura

```
extensions/
├── dynamic-components-example.js    # Componentes con estado dinámico
├── events-and-interactions-example.js # Eventos y interacciones
├── conditional-logic-example.js     # Lógica condicional
└── README.md                        # Esta documentación
```

## 🚀 Cómo crear una extensión

1. **Crear archivo**: Crea un archivo .js en esta carpeta
2. **Exportar función**: Tu extensión debe exportar una función que reciba la configuración
3. **Definir hooks**: Especifica qué hooks quieres usar
4. **Implementar lógica**: Agrega tu funcionalidad personalizada

### Ejemplo básico:

```javascript
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
```

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

```javascript
componentTypes: {
  'mi-tipo': {
    generateCode: function(component, metadata, dataSource) {
      // Lógica para generar código PHP
      return '// Tu código PHP personalizado';
    }
  }
}
```

## 📝 Templates personalizados

Puedes definir templates personalizados:

```javascript
templates: {
  'mi-template': function(componentName, props) {
    return `
    <div class="${componentName}-personalizado">
      <!-- Tu HTML personalizado -->
    </div>
    `;
  }
}
```

## 🪝 Hooks personalizados

Puedes definir hooks personalizados:

```javascript
customHooks: {
  'mi-hook': async function(...args) {
    // Tu lógica personalizada
    return resultado;
  }
}
```

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
