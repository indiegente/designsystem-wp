# 📚 Generador Automático de Stories

Sistema avanzado para generar automáticamente Storybook stories con soporte para **datos personalizados** y manejo robusto de casos edge.

## 🚀 Uso Básico

### Generadores Disponibles

```bash
# Generador básico (legacy)
npm run stories:generate

# Generador robusto (recomendado)
npm run stories:generate:robust

# Sistema de testing para el generador
npm run stories:test
```

### Proceso Automático

El generador robusto:
1. 🔍 Busca componentes sin stories
2. 📦 **Busca archivos .mocks.js personalizados**
3. 📝 Analiza las propiedades de cada componente
4. 🎯 Usa metadata y mocks para generar casos de uso
5. ✅ Crea stories completos con datos realistas
6. 🛠️ Maneja errores y casos edge automáticamente

## 🎯 Características del Generador

### ✨ Análisis Automático

- **Extracción de propiedades**: Lee `static properties` de componentes Lit
- **Tipos de datos**: Detecta String, Number, Boolean, Array, Object
- **Metadata integration**: Usa `component-metadata.json` para contexto
- **Controles Storybook**: Genera controles apropiados automáticamente
- **🆕 Mocks personalizados**: Detecta y usa archivos `.mocks.js` de desarrolladores

### 📦 Sistema de Mocks Personalizados (NUEVO)

Los desarrolladores pueden crear archivos `.mocks.js` junto a sus componentes para definir datos de ejemplo personalizados:

```
src/components/mi-componente/
├── mi-componente.js         # Tu componente Lit
├── mi-componente.mocks.js   # 🆕 Datos personalizados
└── mi-componente.stories.js # Generado automáticamente
```

**Ejemplo de archivo `.mocks.js`:**

```javascript
/**
 * Datos personalizados para Mi Componente
 */
module.exports = {
  // Datos por defecto para el story "Default"
  defaultArgs: {
    title: 'Mi Título Específico',
    subtitle: 'Descripción relevante para mi dominio',
    items: [
      {
        id: 1,
        name: 'Dato real de mi aplicación',
        description: 'Información específica y útil'
      }
    ]
  },

  // Variantes adicionales (stories automáticos)
  variants: {
    empty: {
      title: 'Estado Vacío',
      subtitle: 'Cuando no hay datos',
      items: []
    },
    
    loading: {
      title: 'Cargando...',
      isLoading: true,
      items: []
    },

    error: {
      title: 'Error',
      hasError: true,
      errorMessage: 'No se pudieron cargar los datos'
    }
  }
};
```

**Prioridad de Datos:**
1. 🥇 **Mocks personalizados** (`.mocks.js`)
2. 🥈 Metadata del componente
3. 🥉 Properties detectadas
4. 🏅 Valores por defecto genéricos

### 📖 Documentación Generada

Cada story incluye:

```javascript
export default {
  title: 'Components/Component Name',
  component: 'tl-component-name',
  argTypes: { /* controles automáticos */ },
  parameters: {
    docs: {
      description: {
        component: `
# Component Name

Descripción automática basada en tipo y uso.

## Características

- ✅ Responsive design
- ✅ Accesible (ARIA) 
- ✅ Theming con design tokens
- ✅ Integración WordPress automática

## Uso en WordPress

Información específica sobre integración.
        `
      }
    }
  }
};
```

### 🎨 Stories Automáticos

El generador crea múltiples variants:

#### 1. **Default Story**
```javascript
export const Default = Template.bind({});
Default.args = {
  title: "Título del Componente",
  subtitle: "Subtítulo descriptivo",
  // ... valores ejemplo inteligentes
};
```

#### 2. **Minimal Story**
```javascript
export const Minimal = Template.bind({});
Minimal.args = {
  // Solo propiedades esenciales
};
```

#### 3. **With Data Story** (para componentes agregados)
```javascript
export const WithData = Template.bind({});
WithData.args = {
  features: [
    { title: 'Feature 1', description: 'Desc 1', icon: '🚀' },
    { title: 'Feature 2', description: 'Desc 2', icon: '✨' }
  ]
};
```

#### 4. **Featured Story** (si aplica)
```javascript
export const Featured = Template.bind({});
Featured.args = {
  ...Default.args,
  featured: true
};
```

#### 5. **Grid Layout** (para componentes iterativos)
```javascript
export const Grid = () => html`
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
    ${Template(Default.args)}
    ${Template({...Default.args, featured: true})}
    ${Template(Minimal.args)}
  </div>
`;
```

## 🔧 Personalización

### Valores por Defecto Inteligentes

El generador incluye mapeo inteligente por nombre de propiedad:

```javascript
const nameMap = {
  title: 'Título del Componente',
  subtitle: 'Subtítulo descriptivo del componente', 
  description: 'Descripción detallada...',
  image: 'https://picsum.photos/400/300',
  images: ['https://picsum.photos/400/300', ...],
  icon: '✨',
  link: '#',
  price: 'S/ 1,200',
  testimonials: [{ name: 'María', role: 'Estudiante', ... }],
  features: [{ title: 'Feature 1', description: '...', icon: '🚀' }]
};
```

### Detección de Tipos de Componente

Basándose en metadata, genera documentación específica:

- **Static**: "Componente estático con propiedades configurables"
- **Iterative**: "Se integra con posts del tipo 'X' en WordPress" 
- **Aggregated**: "Recopila y muestra datos agregados de WordPress"

### Controles Storybook

Mapeo automático de tipos a controles:

```javascript
const typeMap = {
  'String': 'text',
  'Number': 'number', 
  'Boolean': 'boolean',
  'Array': 'object',
  'Object': 'object'
};
```

## 📁 Estructura Generada

Para cada componente se crea:

```
src/components/component-name/
├── component-name.js           # Componente existente
└── component-name.stories.js   # ✨ Generado automáticamente
```

### Ejemplo de Story Generado

```javascript
import '../../design-system.stories.js';
import './feature-grid.js';

export default {
  title: 'Components/Feature Grid',
  component: 'tl-feature-grid',
  argTypes: {
    title: { control: "text", description: "Tipo: string. Valor por defecto: \"\"" },
    subtitle: { control: "text", description: "Tipo: string. Valor por defecto: \"\"" },
    features: { control: "text", description: "Tipo: array. Valor por defecto: \"[]\"" }
  },
  parameters: {
    docs: {
      description: {
        component: `
# Feature Grid

Componente para mostrar características en una grilla organizada.

## Características

- ✅ Responsive design
- ✅ Accesible (ARIA)
- ✅ Theming con design tokens
- ✅ Integración WordPress automática

## Uso en WordPress

Recopila y muestra datos agregados de múltiples posts de WordPress.
        `
      }
    }
  }
};

const Template = (args) => {
  const element = document.createElement('tl-feature-grid');
  element.title = args.title;
  element.subtitle = args.subtitle;
  element.features = args.features;
  return element;
};

export const Default = Template.bind({});
Default.args = {
  title: "Título del Componente",
  subtitle: "Subtítulo descriptivo del componente",
  features: [
    { title: "Característica 1", description: "Descripción de la primera característica", icon: "🚀" },
    { title: "Característica 2", description: "Descripción de la segunda característica", icon: "✨" }
  ]
};

export const Minimal = Template.bind({});
Minimal.args = {
  title: "Título del Componente",
  subtitle: "Subtítulo descriptivo del componente"
};

export const WithData = Template.bind({});
WithData.args = {
  ...Default.args,
  features: [
    { title: 'Diseño Responsivo', description: 'Adaptable a cualquier dispositivo', icon: '📱' },
    { title: 'Fácil de Usar', description: 'Interfaz intuitiva y amigable', icon: '🎨' },
    { title: 'Altamente Configurable', description: 'Personalizable según tus necesidades', icon: '⚙️' }
  ]
};
```

## 🎨 Casos de Uso

### 1. Desarrollo de Nuevos Componentes

```bash
# 1. Crear componente Lit
mkdir src/components/new-component
# ... crear new-component.js

# 2. Generar stories automáticamente  
npm run stories:generate

# 3. Personalizar stories generados
# 4. Ejecutar Storybook para ver resultado
npm run storybook
```

### 2. Actualización Masiva

```bash
# Eliminar stories existentes y regenerar
rm src/components/*/\*.stories.js
npm run stories:generate
```

### 3. Componente Específico

```javascript
// En el futuro se podría agregar:
npm run stories:generate -- --component=feature-grid
npm run stories:generate -- --update-existing
```

## 🧪 Sistema de Testing

El generador incluye un sistema completo de testing automático:

```bash
npm run stories:test
```

### Casos de Prueba

El sistema testea **15 casos edge diferentes**:

1. **Componentes básicos**: Properties estándar
2. **Casos edge**: Sin properties, sin tipos, getter patterns
3. **Manejo de errores**: Syntax errors, exports faltantes
4. **Nombres problemáticos**: Palabras reservadas, caracteres especiales
5. **Integración con metadata**: Componentes agregados y estáticos

### Resultados de Testing

```bash
🧪 Iniciando tests del Generador de Stories...

📋 Testando componentes básicos...
✅ Stories generados: simple-component
✅ Stories generados: complex-component

🔥 Testando casos edge...
✅ Stories generados: no-properties
⚠️ Stories generados con fallback: no-export

📊 Resultados de los Tests:
   ✅ Pasaron: 18/21
   ❌ Fallaron: 3/21
   📈 Porcentaje de éxito: 86%
```

### Validación de Stories

- **Sintaxis JavaScript**: Verifica que los stories sean válidos
- **Estructura Storybook**: Confirma export default y stories
- **Contenido DOM**: Valida que los elementos se creen correctamente

## 🔍 Debugging

### Logs del Generador Robusto

```bash
🔍 Generador Robusto: Buscando componentes sin stories...
📝 Encontrados 2 componentes sin stories:
   - feature-grid
   - interactive-gallery

🎯 Generando stories para: feature-grid
📦 Usando mocks personalizados para feature-grid
✅ Stories generados: feature-grid
   Advertencias (2):
     - Posible error de sintaxis: Missing comma in properties
     - Posible error de sintaxis: Missing comma before closing brace

📊 Resumen de Generación:
   ✅ Generados exitosamente: 2
   ❌ Fallaron: 0
   ⚠️ Total de advertencias: 4
   🚨 Total de errores: 0
```

```bash
🔍 Buscando componentes sin stories...
📝 Encontrados 2 componentes sin stories:
   - feature-grid
   - interactive-gallery

🎯 Generando stories para: feature-grid
✅ Stories generados: /path/to/feature-grid.stories.js

🎯 Generando stories para: interactive-gallery  
✅ Stories generados: /path/to/interactive-gallery.stories.js

🎉 Generación completa! Stories creados para 2 componentes.
```

### Errores Comunes

#### ❌ Error: "Cannot find module"
**Causa**: Componente Lit no exporta clase correctamente  
**Solución**: Verificar export en componente:
```javascript
export class ComponentName extends LitElement { ... }
```

#### ❌ Error: "this.generateExampleData is not a function"  
**Causa**: Función faltante en el generador  
**Solución**: Ya corregido en la versión actual

#### ⚠️ Warning: "No properties found"
**Causa**: Componente no tiene `static properties`  
**Resultado**: Se usan valores genéricos por defecto

## 🚀 Nuevas Características (v2.0)

### ✅ Implementado

1. **✅ Sistema de mocks personalizados**: Los desarrolladores definen sus datos
2. **✅ Generador robusto**: Manejo avanzado de casos edge
3. **✅ Testing automático**: 15+ casos de prueba integrados
4. **✅ Validación de sintaxis**: Detección de errores en componentes
5. **✅ Templates DOM**: Compatible con Storybook HTML framework
6. **✅ Variantes automáticas**: Multiple stories por componente

### Características Futuras

1. **Modo interactivo**: Seleccionar qué stories generar
2. **Templates personalizados**: Diferentes plantillas de stories  
3. **Integración con TypeScript**: Mejor detección de tipos
4. **Hot reload**: Regeneración automática al cambiar componentes
5. **Múltiples layouts**: Grid, list, card layouts automáticos
6. **Export ES modules**: Soporte para .mocks.mjs

### Comandos Futuros

```bash
npm run stories:generate -- --interactive
npm run stories:generate -- --template=advanced
npm run stories:generate -- --component=button --force
npm run stories:generate -- --validate
```

## 📚 Recursos

- **[🆕 Guía de Mocks Personalizados](./CUSTOM_MOCKS_GUIDE.md)**: Cómo crear datos personalizados
- [Storybook Documentation](https://storybook.js.org/docs/)
- [Lit Properties Guide](https://lit.dev/docs/components/properties/)
- [Component Metadata Guide](./README.md#configuración-de-componentes)
- [Design System Stories](./src/design-system.stories.js)
- [Tutorial End-to-End](./TUTORIAL_END_TO_END.md)

---

## 🤝 Contribución

Para mejorar el generador:

1. **Fork** el repositorio
2. **Modificar** `scripts/generate-stories.js`
3. **Probar** con diferentes tipos de componentes
4. **Documentar** nuevas características
5. **Crear PR** con ejemplos

### Áreas de Mejora

- [ ] Detección de eventos custom de componentes
- [ ] Generación de casos de error/loading
- [ ] Integración con testing automático
- [ ] Soporte para Web Components estándar
- [ ] Generación de screenshots automáticos

---

**¿Problemas o sugerencias?** Abre un issue o consulta con el equipo de desarrollo.