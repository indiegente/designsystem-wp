# Arquitectura de Componentes: Props vs DataSource

## 🏗️ Introducción

El sistema de generación WordPress del Toulouse Design System maneja múltiples tipos de componentes con diferentes estrategias de datos. Esta documentación explica **en detalle** cuándo y cómo usar `props` vs `dataSource`, evitando conflictos y optimizando la arquitectura.

## 📋 Tipos de Componentes

### 1. **Static Components**
```json
{
  "name": "hero-section",
  "type": "static",
  "props": {
    "title": "Mi título fijo",
    "subtitle": "Mi subtítulo fijo"
  }
}
```
**Características:**
- ✅ Solo usa `props`
- ✅ Valores hardcodeados/estáticos
- ❌ NO tiene `dataSource`
- **Generación PHP**: `render_hero_section('Mi título fijo', 'Mi subtítulo fijo')`

### 2. **Iterative Components**
```json
{
  "name": "course-card",
  "type": "iterative",
  "props": {
    "title": "",
    "description": "",
    "image": "",
    "link": "",
    "link_text": "Ver carrera"
  },
  "dataSource": {
    "type": "post",
    "postType": "carrera",
    "mapping": {
      "title": "post_title",
      "description": "post_excerpt",
      "image": "post_thumbnail_url",
      "link": "post_permalink"
    }
  }
}
```
**Características:**
- ✅ Combina `props` Y `dataSource`
- ✅ Crea loops PHP automáticos
- ✅ Mapping sobrescribe props
- **Generación PHP**:
```php
foreach ($items as $item) {
  render_course_card(
    get_the_title($item),      // Del mapping
    get_the_excerpt($item),    // Del mapping
    get_the_post_thumbnail_url($item), // Del mapping
    get_permalink($item),      // Del mapping
    'Ver carrera'              // Del prop (fallback)
  );
}
```

### 3. **Aggregated Components**
```json
{
  "name": "testimonials",
  "type": "aggregated",
  "props": {
    "title": "Testimonios",
    "subtitle": "Lo que dicen nuestros estudiantes"
  },
  "dataSource": {
    "type": "post",
    "postType": "testimonio",
    "aggregation": {
      "mode": "collect",
      "dataStructure": {
        "name": "post_title",
        "content": "post_excerpt"
      }
    }
  }
}
```
**Características:**
- ✅ Combina `props` Y `dataSource`
- ✅ Props para parámetros estáticos del contenedor
- ✅ DataSource construye arrays de datos
- **Generación PHP**: `render_testimonials('Testimonios', 'Lo que dicen', $testimonials_data)`

## 🔄 Lógica de Precedencia: Props vs Mapping

### Para Componentes Iterative:

1. **Si existe mapping[parámetro]** → Usa el mapping (datos dinámicos)
2. **Si NO existe mapping[parámetro]** → Usa prop[parámetro] (fallback/estático)

### Ejemplo Detallado:

```json
{
  "props": {
    "title": "",           // ← IGNORADO (existe en mapping)
    "description": "",     // ← IGNORADO (existe en mapping)
    "link_text": "Ver más" // ← USADO (NO existe en mapping)
  },
  "dataSource": {
    "mapping": {
      "title": "post_title",      // ← SOBRESCRIBE prop.title
      "description": "post_excerpt" // ← SOBRESCRIBE prop.description
      // link_text NO está mapeado → usa prop.link_text
    }
  }
}
```

**Resultado PHP:**
```php
render_course_card(
  get_the_title($item),    // mapping.title
  get_the_excerpt($item),  // mapping.description
  '',                      // prop.image (vacío, no mapeado)
  '',                      // prop.link (vacío, no mapeado)
  'Ver más'                // prop.link_text (fallback)
);
```

## 🎯 Mejores Prácticas

### ✅ Configuración Óptima para Iterative:

```json
{
  "name": "course-card",
  "props": {
    // Solo parámetros que NO se mapean dinámicamente
    "link_text": "Ver carrera"
  },
  "dataSource": {
    "mapping": {
      // Todos los parámetros dinámicos
      "title": "post_title",
      "description": "post_excerpt",
      "image": "post_thumbnail_url",
      "link": "post_permalink"
    }
  }
}
```

### ❌ Configuración Confusa (evitar):

```json
{
  "props": {
    // Props redundantes que siempre se sobrescriben
    "title": "Este valor nunca se usa",
    "description": "Este tampoco",
    "link_text": "Ver carrera"
  },
  "dataSource": {
    "mapping": {
      "title": "post_title",      // Sobrescribe prop.title
      "description": "post_excerpt" // Sobrescribe prop.description
    }
  }
}
```

## 🔧 Tipos de Mapping Soportados

### 1. **Mapping Simple (String)**
```json
"mapping": {
  "title": "post_title",
  "description": "post_excerpt"
}
```

### 2. **Mapping Robusto (Object + Type)**
```json
"mapping": {
  "description": {
    "source": "meta_course_summary",
    "type": "acf"
  },
  "rating": {
    "source": "meta_rating",
    "type": "native"
  }
}
```

### 3. **Tipos de Fuentes Soportadas:**

| Fuente | Sintaxis | Generación PHP |
|--------|----------|----------------|
| **Post Title** | `"post_title"` | `get_the_title($item)` |
| **Post Excerpt** | `"post_excerpt"` | `get_the_excerpt($item)` |
| **Post Content** | `"post_content"` | `get_the_content(null, false, $item)` |
| **Featured Image** | `"post_thumbnail_url"` | `get_the_post_thumbnail_url($item, 'medium')` |
| **Permalink** | `"post_permalink"` | `get_permalink($item)` |
| **Meta Field (Native)** | `{"source": "meta_price", "type": "native"}` | `get_post_meta($item->ID, 'price', true)` |
| **Meta Field (ACF)** | `{"source": "meta_price", "type": "acf"}` | `get_field('price', $item->ID)` |

## ⚡ Casos de Uso Avanzados

### **Caso 1: ACF Fields con Fallback**
```json
{
  "mapping": {
    "description": {
      "source": "meta_custom_description",
      "type": "acf"
    }
  },
  "aggregation": {
    "defaultValues": {
      "description": "Sin descripción disponible"
    }
  }
}
```
**PHP Generado:** `get_field('custom_description', $item->ID) ?: 'Sin descripción disponible'`

### **Caso 2: Mixing Static + Dynamic**
```json
{
  "props": {
    "button_text": "Descargar",     // Siempre estático
    "button_class": "btn-primary"   // Siempre estático
  },
  "dataSource": {
    "mapping": {
      "title": "post_title",          // Dinámico
      "download_url": {               // Dinámico ACF
        "source": "meta_file_url",
        "type": "acf"
      }
    }
  }
}
```

## 🚨 Errores Comunes y Soluciones

### **Error 1: Parámetro esperado pero no proporcionado**
```
❌ INCONSISTENCIA DE CONFIGURACIÓN: Parámetro title esperado en metadata.json
pero no proporcionado en page-templates.json
```

**Causa:** Metadata declara parámetro, pero ni props ni mapping lo proveen.

**Solución:**
```json
// Opción A: Agregar al mapping
"mapping": {
  "title": "post_title"
}

// Opción B: Agregar fallback en props
"props": {
  "title": ""
}
```

### **Error 2: Setup PostData Context Issues**
```php
// ❌ Problemático (contexto global confuso)
setup_postdata($item);
get_the_title(); // Puede fallar

// ✅ Correcto (contexto explícito)
get_the_title($item);
```

### **Error 3: Prefijos ACF No Robustos**
```json
// ❌ No robusto
"description": "acf_my_field"

// ✅ Robusto
"description": {
  "source": "meta_my_field",
  "type": "acf"
}
```

## 📊 Matriz de Decisiones

| Escenario | Tipo | Props | DataSource | Ejemplo |
|-----------|------|--------|-----------|---------|
| Contenido fijo | `static` | ✅ Valores reales | ❌ No | Hero con texto fijo |
| Lista dinámica | `iterative` | ⚠️ Solo fallbacks | ✅ Con mapping | Cards de productos |
| Array de datos | `aggregated` | ✅ Contenedor | ✅ Para array | Grid de testimonios |
| Híbrido | `iterative` | ✅ Algunos fijos | ✅ Algunos dinámicos | Cards con botón fijo |

## 🔍 Debugging y Validación

El sistema incluye validación automática que verifica:

1. **Consistencia**: Todos los parámetros de metadata tienen valores
2. **Sintaxis PHP**: Código generado válido
3. **WordPress Standards**: PHPCS compliance
4. **Rendering**: Funciones y parámetros correctos

### Comandos de Diagnóstico:
```bash
# Generación completa con validación
npm run wp:generate

# Solo validación
npm run wp:validate

# Verificar URLs en WordPress vivo
npm run wp:test-urls
```

---

## 📚 Recursos Adicionales

- **[CLAUDE.md](./CLAUDE.md)** - Reglas y configuración del proyecto
- **[TUTORIAL_END_TO_END.md](./TUTORIAL_END_TO_END.md)** - Tutorial paso a paso
- **WordPress Codex** - Funciones oficiales de WordPress
- **ACF Documentation** - Advanced Custom Fields

---

**💡 Tip Final:** Cuando tengas dudas sobre la arquitectura, pregúntate:
- ¿Este valor cambia por cada item? → **DataSource mapping**
- ¿Este valor es siempre igual? → **Props**
- ¿Necesito ambos? → **Iterative/Aggregated con híbrido**