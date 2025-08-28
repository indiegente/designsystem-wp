# 📦 Guía de Mocks Personalizados

## Visión General

El generador de stories automático ahora soporta **datos de ejemplo personalizados** que los desarrolladores pueden definir junto con sus componentes. Esto elimina la necesidad de tener datos hardcodeados en el generador y permite que cada desarrollador defina los datos más apropiados para sus componentes.

## 🚀 Cómo Usar

### 1. Crear el archivo de mocks

Junto a tu componente, crea un archivo con el patrón: `{component-name}.mocks.js`

```
src/components/mi-componente/
├── mi-componente.js         # Tu componente Lit
├── mi-componente.mocks.js   # ⭐ Datos personalizados
└── mi-componente.stories.js # Generado automáticamente
```

### 2. Definir la estructura de datos

```javascript
/**
 * Datos de ejemplo para Mi Componente
 */
module.exports = {
  // 📋 Datos por defecto para el story "Default"
  defaultArgs: {
    title: 'Mi Título Personalizado',
    subtitle: 'Descripción específica de mi componente',
    items: [
      {
        id: 1,
        name: 'Item relevante para mi dominio',
        description: 'Descripción específica'
      }
    ]
  },

  // 🎭 Variantes adicionales (stories automáticos)
  variants: {
    empty: {
      title: 'Estado Vacío',
      subtitle: 'Cuando no hay datos',
      items: []
    },
    
    full: {
      title: 'Estado Completo',
      subtitle: 'Con muchos datos',
      items: [
        { id: 1, name: 'Item 1', description: 'Primera opción' },
        { id: 2, name: 'Item 2', description: 'Segunda opción' },
        { id: 3, name: 'Item 3', description: 'Tercera opción' }
      ]
    },

    error: {
      title: 'Estado de Error',
      subtitle: 'Cuando algo falla',
      hasError: true,
      errorMessage: 'No se pudieron cargar los datos'
    }
  }
};
```

### 3. Generar los stories

```bash
npm run stories:generate:robust
```

El generador detectará automáticamente tu archivo `.mocks.js` y generará:

- **Story Default**: Con `defaultArgs`
- **Stories de variantes**: Un story por cada entrada en `variants`

## 📚 Ejemplos Reales

### Ejemplo: Feature Grid

```javascript
// src/components/feature-grid/feature-grid.mocks.js
module.exports = {
  defaultArgs: {
    title: 'Nuestras Características Principales',
    subtitle: 'Descubre todo lo que podemos ofrecerte',
    features: [
      {
        title: 'Diseño Responsivo',
        description: 'Se adapta perfectamente a cualquier dispositivo',
        icon: '📱'
      },
      {
        title: 'Alto Rendimiento',
        description: 'Optimizado para la mejor experiencia',
        icon: '⚡'
      }
    ]
  },

  variants: {
    minimal: {
      title: 'Características Básicas',
      features: [
        { title: 'Simple', description: 'Fácil de usar', icon: '✨' }
      ]
    },
    
    empty: {
      title: 'Características',
      subtitle: 'Cargando...',
      features: []
    }
  }
};
```

### Ejemplo: Interactive Gallery

```javascript
// src/components/interactive-gallery/interactive-gallery.mocks.js
module.exports = {
  defaultArgs: {
    title: 'Galería de Proyectos',
    autoPlay: true,
    showThumbnails: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600',
        title: 'Proyecto de Diseño Web',
        alt: 'Captura de pantalla de un sitio web moderno'
      }
    ]
  },

  variants: {
    loading: {
      title: 'Galería',
      subtitle: 'Cargando imágenes...',
      images: []
    }
  }
};
```

## 🔄 Flujo de Trabajo

1. **Desarrollas tu componente Lit**
2. **Creas el archivo `.mocks.js` con datos relevantes**
3. **Ejecutas el generador de stories**
4. **El sistema usa tus datos automáticamente**
5. **Storybook muestra ejemplos realistas de tu componente**

## 📋 Tipos de Datos Recomendados

### Para Arrays
```javascript
features: [
  { title: 'Item 1', description: 'Descripción útil', icon: '🎯' },
  { title: 'Item 2', description: 'Otra descripción', icon: '✨' }
]
```

### Para Imágenes
```javascript
images: [
  {
    url: 'https://images.unsplash.com/photo-123?w=400&h=300',
    title: 'Título descriptivo',
    alt: 'Texto alternativo para accesibilidad'
  }
]
```

### Para Estados del Componente
```javascript
variants: {
  loading: { isLoading: true, data: [] },
  error: { hasError: true, errorMessage: 'Error específico' },
  empty: { data: [], message: 'No hay datos disponibles' },
  full: { data: [...muchosDatos] }
}
```

## ✅ Beneficios

- **📊 Datos Realistas**: Los stories muestran ejemplos reales de tu dominio
- **🎨 Control Total**: Define exactamente qué datos mostrar
- **🔧 Mantenible**: Los datos están junto al componente, fácil de actualizar
- **🚀 Automático**: Una vez definidos, se generan todos los stories
- **📈 Escalable**: Cada desarrollador maneja sus propios datos

## 🔀 Fallback Automático

Si no tienes archivo `.mocks.js`, el generador usará valores por defecto basados en:

1. **Metadata del componente** (si existe)
2. **Properties detectadas** del componente Lit
3. **Valores genéricos** como último recurso

## 💡 Tips y Mejores Prácticas

- **Usa datos de tu dominio**: En lugar de "Lorem ipsum", usa texto relevante
- **Incluye estados edge**: empty, loading, error
- **URLs de imágenes reales**: Usa Unsplash o imágenes específicas
- **Variantes útiles**: Piensa en los casos de uso reales
- **Documentación inline**: Incluye comentarios explicativos

## 🐛 Solución de Problemas

### Error: "archivo .mocks.js encontrado pero no sigue el formato esperado"
- Verifica que uses `module.exports = { ... }`
- Asegúrate de que la sintaxis JavaScript sea válida

### Los datos no aparecen en Storybook
- Ejecuta `npm run stories:generate:robust` para regenerar
- Verifica que el archivo esté en la ruta correcta: `{component-name}.mocks.js`

### Stories no se generan
- Elimina el archivo `.stories.js` existente y regenera
- Verifica la estructura de `defaultArgs` y `variants`

---

¡Con este sistema, cada desarrollador tiene control total sobre los datos de ejemplo de sus componentes! 🎉