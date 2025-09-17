# Estructura Única de page-templates.json

## 🎯 **Regla Principal**

**ESTRUCTURA ÚNICA**: Toda la configuración de datos se define a nivel de **componente** usando `dataSource`, eliminando configuraciones duplicadas a nivel de página.

## 📋 **Estructura Unificada**

```json
{
  "page-[nombre]": {
    "file": "page-[nombre].php",
    "title": "Título de la página",
    "description": "Descripción SEO de la página",
    "components": [
      {
        "name": "nombre-componente",
        "props": { /* Props del componente */ },
        "dataSource": { /* Configuración de datos OPCIONAL */ },
        "seo": { /* SEO específico del componente OPCIONAL */ },
        "analytics": { /* Analytics específico del componente OPCIONAL */ }
      }
    ]
  }
}
```

## 🔧 **Configuración por Tipo de Componente**

### **1. Static Components**
> Sin configuración de datos, solo props hardcodeados

```json
{
  "name": "hero-section",
  "props": {
    "title": "Título fijo",
    "subtitle": "Subtítulo fijo",
    "ctaText": "Botón fijo",
    "backgroundImage": "ruta/imagen.jpg"
  }
}
```

**Características:**
- ✅ Solo `props` con valores fijos
- ❌ No usa `dataSource`
- 🎯 Contenido estático definido en configuración
- 💡 **Uso**: Contenido que no cambia (hero, footer, banners)

---

### **2. Iterative Components**
> Configuración simple para iterar sobre colecciones

```json
{
  "name": "course-card",
  "props": {
    "title": "",
    "description": "",
    "image": "",
    "link": "",
    "linkText": "Ver carrera"
  },
  "dataSource": {
    "type": "post",
    "postType": "carrera",
    "query": {
      "numberposts": -1,
      "post_status": "publish"
    },
    "mapping": {
      "title": {
        "source": "post_title",
        "type": "native"
      },
      "description": {
        "source": "post_excerpt",
        "type": "native"
      },
      "image": {
        "source": "post_thumbnail_url",
        "type": "native"
      },
      "link": {
        "source": "post_permalink",
        "type": "native"
      },
      "linkText": {
        "source": "Ver carrera",
        "type": "static"
      }
    }
  }
}
```

**Características:**
- ✅ `props` como valores por defecto
- ✅ `dataSource.mapping` para mapear campos
- ✅ `dataSource.query` para filtrar datos
- 🎯 Genera múltiples instancias del componente
- 💡 **Uso**: Listas simples (cards, productos, posts básicos)

---

### **3. Aggregated Components**
> Configuración compleja para coleccionar y agregar datos avanzados

```json
{
  "name": "testimonials",
  "props": {
    "title": "Lo que dicen nuestros estudiantes",
    "subtitle": "Testimonios de éxito de nuestros egresados"
  },
  "dataSource": {
    "type": "post",
    "postType": "testimonio",
    "query": {
      "numberposts": 6,
      "post_status": "publish"
    },
    "mapping": {
      "name": {
        "source": "post_title",
        "type": "native"
      },
      "role": {
        "source": "meta_role",
        "type": "acf"
      },
      "content": {
        "source": "post_content",
        "type": "native"
      },
      "rating": {
        "source": "meta_rating",
        "type": "acf"
      },
      "user_photo": {
        "source": "meta_user_photo",
        "type": "acf"
      },
      "course": {
        "source": "meta_course",
        "type": "acf"
      }
    }
  }
}
```

**Características:**
- ✅ `props` para configuración del contenedor
- ✅ `dataSource.mapping` para campos complejos
- ✅ Soporte completo para campos ACF (fieldType definido en metadata.json)
- ✅ Manejo automático de imágenes con WordPress-native logic
- ✅ Manejo de relaciones y datos complejos
- 🎯 Colecciona datos y los pasa como array al componente
- 💡 **Uso**: Testimonios, portfolios, galerías con ACF, dashboards

## 📚 **Tipos de Fuentes de Datos**

### **Native WordPress Fields**
```json
{
  "source": "post_title|post_excerpt|post_content|post_thumbnail_url|post_permalink",
  "type": "native"
}
```

### **ACF Fields**
```json
{
  "source": "meta_[campo_name]",
  "type": "acf"
}
```
> **Nota**: El `fieldType` se define en metadata.json, no en page-templates.json

### **Static Values**
```json
{
  "source": "Valor estático",
  "type": "static"
}
```

## 🔄 **Separación de Responsabilidades: metadata.json vs page-templates.json**

### **metadata.json - Define QUÉ tipo de campo es**
```json
{
  "arrayFields": {
    "testimonials": [
      { "name": "name", "type": "string", "fieldType": "text" },
      { "name": "role", "type": "string", "fieldType": "text" },
      { "name": "content", "type": "string", "fieldType": "textarea" },
      { "name": "rating", "type": "number", "fieldType": "number" },
      { "name": "user_photo", "type": "string", "fieldType": "image" },
      { "name": "course", "type": "string", "fieldType": "text" }
    ]
  }
}
```

### **page-templates.json - Define DÓNDE viene el dato**
```json
{
  "dataSource": {
    "mapping": {
      "user_photo": {
        "source": "meta_user_photo",
        "type": "acf"
      }
    }
  }
}
```

### **Beneficios de esta separación:**
- ✅ **metadata.json**: Información intrínseca del componente (tipos, estructura)
- ✅ **page-templates.json**: Configuración de datos específica por página
- ✅ **No duplicación**: fieldType una sola vez en metadata
- ✅ **Reutilización**: Un componente puede usar diferentes fuentes de datos
- ✅ **Mantenimiento**: Cambios de tipos centralizados

### **Manejo Automático de Imágenes**
Cuando `fieldType: "image"` en metadata.json, el generador aplica automáticamente:

```php
$field = get_field('user_photo', $item->ID);
if (is_array($field) && isset($field['url'])) return $field['url'];
if (is_numeric($field) && !empty($field)) return wp_get_attachment_image_url((int) $field, 'full') ?: '';
if (is_string($field) && !empty($field)) return $field;
return '';
```

Esto convierte automáticamente:
- **ACF arrays** → URL from array
- **Attachment IDs** → URL via `wp_get_attachment_image_url()`
- **Direct URLs** → Pass through
- **Empty/invalid** → Empty string

## 🗑️ **Eliminación del Tipo "Comprehensive"**

### **¿Por qué se eliminó?**

El tipo `comprehensive` era redundante y confuso:

```json
// ❌ ANTES: Comprehensive (redundante)
"dataSource": {
  "wordpressData": {  // ← Capa extra innecesaria
    "postType": "page",
    "fields": { /* mapeo */ }
  }
}

// ✅ AHORA: Aggregated (simplificado)
"dataSource": {
  "type": "post",
  "postType": "page",
  "mapping": { /* mapeo */ }
}
```

### **Migración realizada:**
- ✅ **test-showcase**: `comprehensive` → `static` (usa props hardcodeados)
- ✅ **Eliminada lógica comprehensive** del generador
- ✅ **Retrocompatibilidad**: comprehensive se redirige a aggregated
- ✅ **Estructura unificada**: Solo 3 tipos necesarios

---

## ⚡ **Beneficios de la Estructura Única**

### ✅ **Consistencia Total**
- Una sola forma de configurar datos
- Mismos nombres de campo en Lit ↔ dataSource
- Sin duplicaciones ni configuraciones mixtas

### ✅ **Escalabilidad**
- Fácil de entender para nuevos desarrolladores
- Estructura predecible para cualquier tipo de componente
- Extensible para casos futuros

### ✅ **Mantenibilidad**
- Cambios centralizados en cada componente
- No hay configuraciones dispersas
- Fácil debugging y validación

### ✅ **Separación de Responsabilidades**
- **Página**: Solo metadatos básicos (title, description, file)
- **Componente**: Toda la lógica de datos y configuración
- **Props**: Valores por defecto y estructura
- **DataSource**: Mapeo dinámico de WordPress

## 🚨 **Reglas Críticas**

### **1. Nunca duplicar configuraciones**
```json
❌ INCORRECTO:
"page-ejemplo": {
  "wordpressData": { /* Configuración en página */ },
  "components": [{
    "dataSource": { /* Misma configuración en componente */ }
  }]
}

✅ CORRECTO:
"page-ejemplo": {
  "components": [{
    "dataSource": { /* Solo en componente */ }
  }]
}
```

### **2. Nombres de campo consistentes**
```json
// Lit Component
static properties = {
  linkText: { type: String }  // camelCase
}

// DataSource
"mapping": {
  "linkText": {  // ✅ Mismo nombre exacto
    "source": "Ver más",
    "type": "static"
  }
}
```

### **3. Estructura por tipo**
- **Static**: Solo `props`
- **Iterative**: `dataSource.mapping` simple
- **Aggregated**: `dataSource.mapping` complejo con ACF

### **4. No mezclar estructuras**
```json
❌ INCORRECTO:
"dataSource": {
  "mapping": { /* Estructura iterative */ },
  "wordpressData": { /* Estructura comprehensive */ }
}

✅ CORRECTO: Elegir una estructura según el tipo
```

## 📝 **Ejemplo Completo**

```json
{
  "page-ejemplo": {
    "file": "page-ejemplo.php",
    "title": "Página de Ejemplo",
    "description": "Ejemplo de estructura unificada",
    "components": [
      {
        "name": "hero-section",
        "props": {
          "title": "Bienvenidos",
          "ctaText": "Comenzar"
        }
      },
      {
        "name": "blog-posts",
        "props": {
          "title": "Últimas Noticias"
        },
        "dataSource": {
          "type": "post",
          "postType": "post",
          "query": {
            "numberposts": 5,
            "post_status": "publish"
          },
          "mapping": {
            "title": {
              "source": "post_title",
              "type": "native"
            },
            "excerpt": {
              "source": "post_excerpt",
              "type": "native"
            }
          }
        }
      }
    ]
  }
}
```

---

**✅ ESTADO: IMPLEMENTADO Y DOCUMENTADO**

Esta estructura única elimina inconsistencias y establece un patrón claro para toda configuración futura.