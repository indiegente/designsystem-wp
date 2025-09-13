# 🎯 Tutorial End-to-End: De Lit Component a WordPress

Este tutorial te guía paso a paso desde la creación de un componente Lit en Storybook hasta su generación completa como tema WordPress, incluyendo extensiones avanzadas.

## 📋 Tabla de Contenidos

- [🎯 Objetivo](#-objetivo)
- [🏁 Prerrequisitos](#-prerrequisitos)
- [📖 Paso a Paso](#-paso-a-paso)
  - [Paso 1: Crear el Componente Lit](#paso-1-crear-el-componente-lit)
  - [Paso 2: Documentar en Storybook](#paso-2-documentar-en-storybook)
  - [Paso 3: Configurar Metadata](#paso-3-configurar-metadata)
  - [Paso 4: Configurar Página WordPress](#paso-4-configurar-página-wordpress)
  - [Paso 5: Crear Extensión Personalizada](#paso-5-crear-extensión-personalizada)
  - [Paso 6: Generar Tema WordPress](#paso-6-generar-tema-wordpress)
  - [Paso 7: Validar y Probar](#paso-7-validar-y-probar)
- [🔧 Personalización Avanzada](#-personalización-avanzada)
- [🚀 Despliegue en Producción](#-despliegue-en-producción)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🚨 Comportamiento Fail-Fast](#-comportamiento-fail-fast)

## 🎯 Objetivo

Al final de este tutorial habrás:

✅ Creado un componente Lit funcional  
✅ Documentado el componente en Storybook  
✅ Configurado metadata para WordPress  
✅ Creado una extensión personalizada  
✅ Generado un tema WordPress completo  
✅ Validado el funcionamiento end-to-end  

## 🏁 Prerrequisitos

- Node.js 18+ instalado
- Conocimientos básicos de JavaScript/PHP
- WordPress local (opcional, para testing)

```bash
# Verificar instalación
node --version
npm --version
```

## 📖 Paso a Paso

### Paso 1: Crear el Componente Lit

Vamos a crear un componente **Product Card** que mostrará productos/servicios.

#### 1.1 Crear estructura de archivos

```bash
mkdir src/components/product-card
touch src/components/product-card/product-card.js
touch src/components/product-card/product-card.stories.js
```

#### 1.2 Implementar el componente Lit

```javascript
// src/components/product-card/product-card.js
import { LitElement, html, css } from 'lit';

export class ProductCard extends LitElement {
  static properties = {
    title: { type: String },
    description: { type: String },
    price: { type: String },
    image: { type: String },
    category: { type: String },
    featured: { type: Boolean },
    link: { type: String },
    linkText: { type: String }
  };

  constructor() {
    super();
    this.title = '';
    this.description = '';
    this.price = '';
    this.image = '';
    this.category = '';
    this.featured = false;
    this.link = '';
    this.linkText = 'Ver más';
  }

  static styles = css`
    :host {
      display: block;
    }

    .product-card {
      background: var(--tl-neutral-50);
      border-radius: var(--tl-spacing-2);
      padding: var(--tl-spacing-6);
      box-shadow: var(--tl-shadow-md);
      transition: var(--tl-transition-normal);
      position: relative;
      overflow: hidden;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--tl-shadow-lg);
    }

    .product-card.featured::before {
      content: 'Destacado';
      position: absolute;
      top: var(--tl-spacing-4);
      right: var(--tl-spacing-4);
      background: var(--tl-primary-500);
      color: white;
      padding: var(--tl-spacing-1) var(--tl-spacing-2);
      border-radius: var(--tl-spacing-1);
      font-size: var(--tl-font-size-sm);
      font-weight: 600;
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: var(--tl-spacing-2);
      margin-bottom: var(--tl-spacing-4);
    }

    .product-category {
      color: var(--tl-primary-500);
      font-size: var(--tl-font-size-sm);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: var(--tl-spacing-2);
    }

    .product-title {
      font-size: var(--tl-font-size-xl);
      font-weight: 700;
      color: var(--tl-neutral-900);
      margin-bottom: var(--tl-spacing-3);
      line-height: 1.3;
    }

    .product-description {
      color: var(--tl-neutral-600);
      line-height: 1.5;
      margin-bottom: var(--tl-spacing-4);
    }

    .product-price {
      font-size: var(--tl-font-size-2xl);
      font-weight: 700;
      color: var(--tl-primary-600);
      margin-bottom: var(--tl-spacing-4);
    }

    .product-link {
      display: inline-flex;
      align-items: center;
      background: var(--tl-primary-500);
      color: white;
      padding: var(--tl-spacing-3) var(--tl-spacing-4);
      border-radius: var(--tl-spacing-2);
      text-decoration: none;
      font-weight: 600;
      transition: var(--tl-transition-normal);
    }

    .product-link:hover {
      background: var(--tl-primary-600);
      transform: translateY(-1px);
    }

    .product-link::after {
      content: '→';
      margin-left: var(--tl-spacing-2);
      transition: var(--tl-transition-normal);
    }

    .product-link:hover::after {
      transform: translateX(4px);
    }
  `;

  render() {
    return html`
      <div class="product-card ${this.featured ? 'featured' : ''}">
        ${this.image ? html`
          <img 
            class="product-image" 
            src="${this.image}" 
            alt="${this.title}"
            loading="lazy"
          />
        ` : ''}
        
        ${this.category ? html`
          <div class="product-category">${this.category}</div>
        ` : ''}
        
        <h3 class="product-title">${this.title}</h3>
        
        ${this.description ? html`
          <p class="product-description">${this.description}</p>
        ` : ''}
        
        ${this.price ? html`
          <div class="product-price">${this.price}</div>
        ` : ''}
        
        ${this.link ? html`
          <a href="${this.link}" class="product-link">
            ${this.linkText}
          </a>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('tl-product-card', ProductCard);
```

### Paso 2: Documentar en Storybook (Actualizado con Mocks Personalizados)

#### 2.1 Crear datos personalizados del componente

Primero, vamos a crear datos de ejemplo específicos para nuestro Product Card:

```javascript
// src/components/product-card/product-card.mocks.js
/**
 * Datos de ejemplo para Product Card
 * Específicos del dominio de productos/servicios
 */
module.exports = {
  // Datos por defecto para el story principal
  defaultArgs: {
    title: 'Diseño Gráfico Digital',
    description: 'Curso completo de diseño gráfico con herramientas profesionales como Photoshop, Illustrator y InDesign. Aprende desde los fundamentos hasta proyectos avanzados.',
    price: 'S/ 1,250',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    category: 'Diseño',
    featured: false,
    link: '#curso-diseño-grafico',
    linkText: 'Ver curso completo'
  },

  // Variantes para diferentes estados
  variants: {
    featured: {
      title: 'Desarrollo Web Full Stack',
      description: 'Conviértete en desarrollador full stack con tecnologías modernas: HTML5, CSS3, JavaScript, React, Node.js y bases de datos.',
      price: 'S/ 1,800',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      category: 'Programación',
      featured: true,
      link: '#curso-desarrollo-web',
      linkText: 'Inscríbete ahora'
    },

    premium: {
      title: 'Marketing Digital Avanzado',
      description: 'Domina el marketing digital con estrategias de SEO, SEM, redes sociales, email marketing y analytics. Incluye certificación Google.',
      price: 'S/ 2,100',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      category: 'Marketing',
      featured: true,
      link: '#curso-marketing-digital',
      linkText: 'Más información',
      isPremium: true
    },

    loading: {
      title: 'Cargando...',
      description: 'Obteniendo información del producto...',
      price: '---',
      image: '',
      category: '',
      featured: false,
      link: '#',
      linkText: 'Cargando',
      isLoading: true
    },

    error: {
      title: 'Error al cargar',
      description: 'No se pudo cargar la información del producto. Intenta nuevamente.',
      price: 'N/A',
      image: '',
      category: 'Error',
      featured: false,
      link: '#',
      linkText: 'Reintentar',
      hasError: true
    }
  }
};
```

#### 2.2 Generar stories automáticamente

En lugar de crear el archivo `.stories.js` manualmente, usamos el generador:

```bash
npm run stories:generate:robust
```

Esto generará automáticamente:

```bash
🔍 Generador Robusto: Buscando componentes sin stories...
📝 Encontrados 1 componentes sin stories:
   - product-card

🎯 Generando stories para: product-card
📦 Usando mocks personalizados para product-card
✅ Stories generados: product-card
```

#### 2.3 Story generado automáticamente

El generador creará el siguiente archivo:

```javascript
// src/components/product-card/product-card.stories.js (GENERADO AUTOMÁTICAMENTE)
import '../../design-system.stories.js';
import './product-card.js';

export default {
  title: 'Components/Product Card',
  component: 'tl-product-card',
  argTypes: {
    // Controles generados automáticamente
    title: { control: 'text', description: 'Tipo: string' },
    description: { control: 'text', description: 'Tipo: string' },
    price: { control: 'text', description: 'Tipo: string' },
    image: { control: 'text', description: 'Tipo: string' },
    category: { control: 'text', description: 'Tipo: string' },
    featured: { control: 'boolean', description: 'Tipo: boolean' }
  },
  parameters: {
    docs: {
      description: {
        component: `
# Product Card

Componente para mostrar productos o servicios con datos personalizados específicos del dominio educativo.

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
  const element = document.createElement('tl-product-card');
  element.title = args.title;
  element.description = args.description;
  element.price = args.price;
  element.image = args.image;
  element.category = args.category;
  element.featured = args.featured;
  element.link = args.link;
  element.linkText = args.linkText;
  return element;
};

// Stories generados automáticamente usando nuestros mocks personalizados
export const Default = Template.bind({});
Default.args = {
  title: 'Diseño Gráfico Digital',
  description: 'Curso completo de diseño gráfico con herramientas profesionales...',
  price: 'S/ 1,250',
  image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5...',
  category: 'Diseño',
  featured: false,
  link: '#curso-diseño-grafico',
  linkText: 'Ver curso completo'
};

export const Featured = Template.bind({});
Featured.args = {
  title: 'Desarrollo Web Full Stack',
  description: 'Conviértete en desarrollador full stack...',
  price: 'S/ 1,800',
  // ... datos específicos del mock
  featured: true
};

export const Premium = Template.bind({});
Premium.args = {
  title: 'Marketing Digital Avanzado',
  description: 'Domina el marketing digital...',
  price: 'S/ 2,100',
  // ... datos específicos del mock
  isPremium: true
};

export const Loading = Template.bind({});
Loading.args = {
  title: 'Cargando...',
  description: 'Obteniendo información del producto...',
  isLoading: true
};

export const Error = Template.bind({});
Error.args = {
  title: 'Error al cargar',
  description: 'No se pudo cargar la información...',
  hasError: true
};
```

#### 2.4 Resultado del Sistema

✅ **5 stories generados automáticamente** usando nuestros datos personalizados:
- `Default`: Curso de Diseño Gráfico
- `Featured`: Curso de Desarrollo Web (destacado)
- `Premium`: Marketing Digital (premium)
- `Loading`: Estado de carga
- `Error`: Estado de error

✅ **Datos realistas**: Específicos del dominio educativo
✅ **Múltiples estados**: Cubre casos de uso reales
✅ **Documentación automática**: Generada con contexto

#### 2.5 Verificar en Storybook

```bash
npm run storybook
```

Navega a `http://localhost:6006` y verifica que:

✅ **5 stories aparezcan automáticamente** con nombres significativos
✅ **Datos realistas del dominio educativo** se muestren en cada story  
✅ **Estados diferentes** (normal, destacado, premium, loading, error) funcionen
✅ **Controles interactivos** permitan modificar las propiedades en tiempo real

**💡 Ventaja del nuevo sistema**: Sin archivos `.mocks.js`, habrías tenido datos genéricos como "Título del Componente" y arrays vacíos. Con mocks personalizados, tienes datos específicos del dominio que demuestran mejor el propósito real del componente.

### Paso 3: Configurar Metadata - Guía Detallada de Atributos

La metadata es el corazón del sistema de generación automática. Define cómo cada componente Lit se convierte en PHP, qué datos consume, y cómo se integra con WordPress.

#### 3.1 Estructura General del Metadata

El archivo `src/component-metadata.json` contiene cuatro secciones principales:

```json
{
  "postTypes": { /* Tipos de posts personalizados WordPress */ },
  "templates": { /* Plantillas de página PHP */ },
  "componentMapping": { /* Mapeo componente → post_type */ },
  "[component-name]": { /* Configuración por componente */ }
}
```

---

#### 3.2 Sección PostTypes - Tipos de Contenido WordPress

Define los **Custom Post Types** que alimentarán tus componentes con datos reales:

| Atributo | Tipo | Obligatorio | Descripción | Ejemplo |
|----------|------|-------------|-------------|---------|
| `labels.name` | string | ✅ | Nombre plural en WordPress admin | "Carreras", "Productos" |
| `labels.singular_name` | string | ✅ | Nombre singular en WordPress admin | "Carrera", "Producto" |
| `public` | boolean | ❌ | Si aparece en front-end y admin | `true` |
| `supports` | array | ❌ | Funcionalidades WordPress | `["title", "editor", "thumbnail"]` |
| `show_in_rest` | boolean | ❌ | API REST habilitada | `true` |

**Ejemplo práctico:**
```json
"postTypes": {
  "carrera": {
    "labels": { "name": "Carreras", "singular_name": "Carrera" },
    "public": true,
    "supports": ["title", "editor", "thumbnail", "excerpt"],
    "show_in_rest": true
  }
}
```

**🔄 Lógica de uso:** El sistema usa `componentMapping` para conectar componentes con postTypes. Si tu componente `course-card` está mapeado a `carrera`, automáticamente consumirá datos del post_type `carrera`.

---

#### 3.3 Sección Templates - Páginas WordPress

Define las **plantillas PHP** que se generarán automáticamente:

| Atributo | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| `file` | string | ✅ | Nombre del archivo PHP generado |
| `title` | string | ✅ | Título para WordPress admin |
| `description` | string | ❌ | Descripción de la plantilla |

**Ejemplo:**
```json
"templates": {
  "page-carreras": {
    "file": "page-carreras.php",
    "title": "Carreras",
    "description": "Listado de todas las carreras disponibles"
  }
}
```

---

#### 3.4 Sección ComponentMapping - Conexión Componente ↔ Datos

Conecta componentes con sus fuentes de datos:

```json
"componentMapping": {
  "course-card": "carrera",     // course-card consume posts del tipo "carrera"
  "product-card": "producto",   // product-card consume posts del tipo "producto"
  "testimonials": "testimonio"  // testimonials consume posts del tipo "testimonio"
}
```

**🔄 Lógica:** Si no hay mapping, el componente se considera estático y usará valores por defecto.

---

#### 3.5 Configuración por Componente - Los Tipos Principales

Cada componente tiene una configuración detallada. Hay **4 tipos principales:**

##### **Tipo 1: STATIC** - Componentes con datos fijos

Para componentes como heroes, headers, footers que no cambian dinámicamente.

```json
"hero-section": {
  "type": "static",
  "phpFunction": "render_hero_section",
  "parameters": [
    { "name": "title", "type": "string", "default": "" },
    { "name": "subtitle", "type": "string", "default": "" }
  ],
  "template": "hero-section"
}
```

| Atributo | Descripción |
|----------|-------------|
| `type: "static"` | No consume datos WordPress, usa valores fijos |
| `phpFunction` | Nombre de la función PHP generada |
| `parameters` | Array de propiedades del componente Lit |
| `template` | Nombre del template (sin extensión) |

##### **Tipo 2: ITERATIVE** - Un componente por cada post

Para cards, items que se repiten individualmente.

```json
"product-card": {
  "type": "iterative",
  "phpFunction": "render_product_card", 
  "parameters": [
    { "name": "title", "type": "string", "default": "" },
    { "name": "price", "type": "string", "default": "" },
    { "name": "featured", "type": "boolean", "default": false }
  ],
  "template": "product-card",
  "iteration": {
    "mode": "individual",
    "renderPerItem": true
  }
}
```

| Atributo | Descripción |
|----------|-------------|
| `iteration.mode: "individual"` | Se crea una instancia por cada post |
| `iteration.renderPerItem: true` | Cada post genera su propio HTML |

**🔄 Mapeo automático de datos:**
- `title` (Lit) ← `post_title` (WordPress)  
- `description` (Lit) ← `post_content` (WordPress)
- `image` (Lit) ← `thumbnail` (WordPress)
- `featured` (Lit) ← `meta_featured` (WordPress meta field)

##### **Tipo 3: AGGREGATED** - Un componente con array de datos

Para componentes que muestran múltiples posts en una sola instancia.

```json
"testimonials": {
  "type": "aggregated",
  "phpFunction": "render_testimonials",
  "parameters": [
    { "name": "title", "type": "string", "default": "" },
    { "name": "testimonials", "type": "array", "default": "[]" }
  ],
  "template": "testimonials",
  "aggregation": {
    "mode": "collect",
    "dataStructure": {
      "name": "post_title",
      "role": "post_excerpt",
      "content": "post_content", 
      "rating": "meta_rating",
      "avatar": "meta_avatar"
    },
    "defaultValues": {
      "rating": 5
    }
  }
}
```

| Atributo | Descripción |
|----------|-------------|
| `aggregation.mode: "collect"` | Recolecta múltiples posts en un array |
| `aggregation.dataStructure` | Mapeo entre campos Lit y WordPress |
| `aggregation.defaultValues` | Valores por defecto si faltan datos |

**🔄 Ejemplo de resultado:**
```php
// WordPress genera automáticamente:
$testimonials = [
  ["name" => "Juan Pérez", "role" => "Estudiante", "rating" => 5],
  ["name" => "María García", "role" => "Graduada", "rating" => 4]
];
render_testimonials("Testimonios", "", $testimonials);
```

##### **Tipo 4: INTERACTIVE** - Componentes con estado JavaScript

Para galerías, carruseles, componentes que requieren interactividad.

```json
"interactive-gallery": {
  "type": "interactive",
  "phpFunction": "render_interactive_gallery",
  "parameters": [
    { "name": "images", "type": "array", "default": "[]" },
    { "name": "autoPlay", "type": "boolean", "default": "true" }
  ],
  "template": "interactive-gallery",
  "interaction": {
    "mode": "stateful",
    "events": ["image-changed", "autoplay-toggled"],
    "stateManagement": true
  }
}
```

| Atributo | Descripción |
|----------|-------------|
| `interaction.mode: "stateful"` | Mantiene estado JavaScript |
| `interaction.events` | Eventos que el componente puede disparar |
| `interaction.stateManagement: true` | Requiere JavaScript para funcionar |

---

#### 3.6 Configuración de Parámetros - Mapeo Lit ↔ PHP

Cada parámetro en el array `parameters` debe corresponder exactamente a una **property** del componente Lit:

**En tu componente Lit:**
```javascript
class ProductCard extends LitElement {
  static properties = {
    title: { type: String },
    price: { type: String }, 
    featured: { type: Boolean },
    category: { type: String }
  };
}
```

**En el metadata:**
```json
"parameters": [
  { "name": "title", "type": "string", "default": "" },
  { "name": "price", "type": "string", "default": "" },
  { "name": "featured", "type": "boolean", "default": false },
  { "name": "category", "type": "string", "default": "" }
]
```

| Lit Type | Metadata Type | PHP Result |
|----------|---------------|------------|
| `String` | `"string"` | `"texto"` |
| `Boolean` | `"boolean"` | `true/false` |
| `Array` | `"array"` | `[]` o JSON string |
| `Number` | `"number"` | `123` |
| `Object` | `"object"` | `{}` o JSON string |

---

#### 3.7 Ejemplo Completo de Configuración

```json
{
  "postTypes": {
    "carrera": {
      "labels": { "name": "Carreras", "singular_name": "Carrera" },
      "public": true,
      "supports": ["title", "editor", "thumbnail", "excerpt"]
    }
  },
  "templates": {
    "page-carreras": {
      "file": "page-carreras.php", 
      "title": "Carreras"
    }
  },
  "componentMapping": {
    "course-card": "carrera"
  },
  "course-card": {
    "type": "iterative",
    "phpFunction": "render_course_card",
    "parameters": [
      { "name": "title", "type": "string", "default": "" },
      { "name": "description", "type": "string", "default": "" }
    ],
    "template": "course-card",
    "iteration": {
      "mode": "individual",
      "renderPerItem": true
    }
  }
}
```

**🎯 Resultado automático:**
1. ✅ Se crea post_type `carrera` en WordPress
2. ✅ Se genera `page-carreras.php` 
3. ✅ Se crea función `render_course_card()` 
4. ✅ Los posts de tipo `carrera` alimentan automáticamente `course-card`

---

#### 3.8 Ejemplos Prácticos por Tipo de Componente

##### 📄 **Componente STATIC** - Hero Section

**Caso de uso:** Header principal de página, no cambia con datos WordPress.

**Componente Lit:**
```javascript
// src/components/hero-section/hero-section.js
class HeroSection extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    ctaText: { type: String },
    backgroundImage: { type: String }
  };
}
```

**Metadata correspondiente:**
```json
"hero-section": {
  "type": "static",
  "phpFunction": "render_hero_section",
  "parameters": [
    { "name": "title", "type": "string", "default": "" },
    { "name": "subtitle", "type": "string", "default": "" },
    { "name": "ctaText", "type": "string", "default": "Conocer más" },
    { "name": "backgroundImage", "type": "string", "default": "" }
  ],
  "template": "hero-section"
}
```

**📤 PHP generado automáticamente:**
```php
function render_hero_section($title = '', $subtitle = '', $ctaText = 'Conocer más', $backgroundImage = '') {
    ?>
    <div class="hero-section">
        <h1><?php echo esc_html($title); ?></h1>
        <p><?php echo esc_html($subtitle); ?></p>
        <a href="#" class="cta-button"><?php echo esc_html($ctaText); ?></a>
    </div>
    <?php
}
```

---

##### 🔄 **Componente ITERATIVE** - Product Card

**Caso de uso:** Cards que se repiten para cada producto de la base de datos.

**Componente Lit:**
```javascript
// src/components/product-card/product-card.js
class ProductCard extends LitElement {
  static properties = {
    title: { type: String },
    price: { type: String },
    category: { type: String },
    featured: { type: Boolean },
    image: { type: String }
  };
}
```

**Metadata correspondiente:**
```json
"product-card": {
  "type": "iterative", 
  "phpFunction": "render_product_card",
  "parameters": [
    { "name": "title", "type": "string", "default": "" },
    { "name": "price", "type": "string", "default": "" },
    { "name": "category", "type": "string", "default": "" },
    { "name": "featured", "type": "boolean", "default": false },
    { "name": "image", "type": "string", "default": "" }
  ],
  "template": "product-card",
  "iteration": {
    "mode": "individual",
    "renderPerItem": true
  }
}
```

**🎯 Mapeo automático de datos:**
- `title` ← `post_title`
- `price` ← `meta_precio` (custom field) 
- `category` ← `taxonomy_categoria`
- `featured` ← `meta_destacado` (custom field)
- `image` ← `post_thumbnail_url`

**📤 PHP generado automáticamente:**
```php
// En la página PHP se genera automáticamente:
$productos = get_posts(['post_type' => 'producto', 'numberposts' => -1]);
foreach ($productos as $producto) {
    $precio = get_post_meta($producto->ID, 'precio', true);
    $destacado = (bool)get_post_meta($producto->ID, 'destacado', true);
    $imagen = get_the_post_thumbnail_url($producto->ID);
    
    render_product_card(
        $producto->post_title,
        $precio,
        $categoria,
        $destacado, 
        $imagen
    );
}
```

---

##### 📚 **Componente AGGREGATED** - Testimonials

**Caso de uso:** Un solo componente que muestra múltiples testimonios en array.

**Componente Lit:**
```javascript
// src/components/testimonials/testimonials.js
class Testimonials extends LitElement {
  static properties = {
    title: { type: String },
    testimonials: { type: Array }
  };
}
```

**Metadata correspondiente:**
```json
"testimonials": {
  "type": "aggregated",
  "phpFunction": "render_testimonials", 
  "parameters": [
    { "name": "title", "type": "string", "default": "" },
    { "name": "testimonials", "type": "array", "default": "[]" }
  ],
  "template": "testimonials",
  "aggregation": {
    "mode": "collect",
    "dataStructure": {
      "name": "post_title",
      "role": "post_excerpt",
      "content": "post_content",
      "rating": "meta_rating",
      "course": "meta_course"
    },
    "defaultValues": {
      "rating": 5
    }
  }
}
```

**📤 PHP generado automáticamente:**
```php
// El sistema recolecta automáticamente:
$testimonials_posts = get_posts(['post_type' => 'testimonio', 'numberposts' => 6]);
$testimonials = [];

foreach ($testimonials_posts as $post) {
    $testimonials[] = [
        'name' => $post->post_title,
        'role' => $post->post_excerpt,
        'content' => $post->post_content,
        'rating' => get_post_meta($post->ID, 'rating', true) ?: 5,
        'course' => get_post_meta($post->ID, 'course', true)
    ];
}

render_testimonials("Lo que dicen nuestros estudiantes", $testimonials);
```

---

##### 🖼️ **Componente INTERACTIVE** - Gallery

**Caso de uso:** Galería que requiere JavaScript para interactividad.

**Componente Lit:**
```javascript
// src/components/interactive-gallery/interactive-gallery.js
class InteractiveGallery extends LitElement {
  static properties = {
    images: { type: Array },
    autoPlay: { type: Boolean },
    showThumbnails: { type: Boolean }
  };
}
```

**Metadata correspondiente:**
```json
"interactive-gallery": {
  "type": "interactive",
  "phpFunction": "render_interactive_gallery",
  "parameters": [
    { "name": "images", "type": "array", "default": "[]" },
    { "name": "autoPlay", "type": "boolean", "default": "true" },
    { "name": "showThumbnails", "type": "boolean", "default": "true" }
  ],
  "template": "interactive-gallery",
  "interaction": {
    "mode": "stateful",
    "events": ["image-changed", "autoplay-toggled"],
    "stateManagement": true
  }
}
```

**📤 PHP generado automáticamente:**
```php
function render_interactive_gallery($images = '[]', $autoPlay = true, $showThumbnails = true) {
    $images_data = is_string($images) ? json_decode($images, true) : $images;
    ?>
    <div class="interactive-gallery" 
         data-autoplay="<?php echo $autoPlay ? 'true' : 'false'; ?>"
         data-thumbnails="<?php echo $showThumbnails ? 'true' : 'false'; ?>">
        <?php foreach ($images_data as $image): ?>
            <img src="<?php echo esc_url($image['url']); ?>" 
                 alt="<?php echo esc_attr($image['alt']); ?>">
        <?php endforeach; ?>
    </div>
    <script>
        // Se incluye automáticamente el JavaScript para interactividad
        initInteractiveGallery();
    </script>
    <?php
}
```

---

#### 3.9 Mapeo Avanzado - Properties de Lit → Metadata

**🎯 Reglas de conversión automática:**

| Lit Property | Metadata Parameter | PHP Variable | WordPress Source |
|--------------|-------------------|--------------|------------------|
| `title: { type: String }` | `{ "name": "title", "type": "string" }` | `$title` | `post_title` |
| `featured: { type: Boolean }` | `{ "name": "featured", "type": "boolean" }` | `$featured` | `meta_featured` |
| `items: { type: Array }` | `{ "name": "items", "type": "array" }` | `$items` | `json_decode(meta_items)` |
| `price: { type: Number }` | `{ "name": "price", "type": "number" }` | `$price` | `(int)meta_price` |

**💡 Consejos de configuración:**

1. **Nombres consistentes:** Usa el mismo nombre en Lit property y metadata parameter
2. **Tipos exactos:** `String` → `"string"`, `Boolean` → `"boolean"`, `Array` → `"array"`
3. **Defaults útiles:** Proporciona defaults realistas, no vacíos
4. **Custom fields:** Para datos específicos usa `meta_[nombre]` en WordPress

### Paso 4: Configurar Página WordPress

#### 4.1 Agregar página de productos

```json
// src/page-templates.json
{
  "page-carreras": {
    "title": "Carreras",
    "description": "Explora nuestras carreras técnicas y programas especializados",
    "components": [
      {
        "name": "hero-section",
        "props": {
          "title": "Nuestras Carreras",
          "subtitle": "Descubre tu potencial creativo con nuestras carreras técnicas",
          "ctaText": "Explorar carreras",
          "backgroundImage": ""
        },
        "seo": {
          "title": "Carreras Técnicas | Toulouse Lautrec",
          "description": "Explora nuestras carreras técnicas y programas especializados en diseño, tecnología y creatividad.",
          "keywords": "carreras técnicas, diseño, tecnología, creatividad, Toulouse Lautrec",
          "ogImage": "",
          "canonical": "/carreras"
        },
        "analytics": {
          "pageView": "page_view_carreras",
          "events": [
            {
              "name": "hero_cta_click",
              "category": "engagement",
              "action": "click",
              "label": "hero_cta_carreras"
            }
          ]
        }
      },
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
          "type": "wordpress_posts",
          "postType": "carrera",
          "query": {
            "numberposts": -1,
            "post_status": "publish"
          },
          "mapping": {
            "title": "post_title",
            "description": "post_excerpt",
            "image": "post_thumbnail_url",
            "link": "post_permalink"
          }
        }
      }
    ]
  },
  "page-productos": {
    "title": "Productos y Servicios",
    "description": "Descubre nuestros productos y servicios especializados",
    "components": [
      {
        "name": "hero-section",
        "props": {
          "title": "Productos y Servicios",
          "subtitle": "Soluciones creativas diseñadas para impulsar tu éxito",
          "ctaText": "Ver catálogo",
          "backgroundImage": ""
        },
        "seo": {
          "title": "Productos y Servicios | Toulouse Lautrec",
          "description": "Descubre nuestros productos y servicios especializados en diseño, consultoría y capacitación.",
          "keywords": "productos, servicios, diseño, consultoría, capacitación, Toulouse Lautrec",
          "ogImage": "",
          "canonical": "/productos"
        },
        "analytics": {
          "pageView": "page_view_productos",
          "events": [
            {
              "name": "hero_cta_click",
              "category": "engagement",
              "action": "click",
              "label": "hero_cta_productos"
            },
            {
              "name": "product_card_click",
              "category": "engagement",
              "action": "click",
              "label": "product_card_view"
            }
          ]
        }
      },
      {
        "name": "product-card",
        "props": {
          "title": "",
          "description": "",
          "price": "",
          "image": "",
          "category": "",
          "featured": false,
          "link": "",
          "linkText": "Ver producto"
        },
        "dataSource": {
          "type": "wordpress_posts",
          "postType": "producto",
          "query": {
            "numberposts": -1,
            "post_status": "publish",
            "orderby": "menu_order",
            "order": "ASC"
          },
          "mapping": {
            "title": "post_title",
            "description": "post_excerpt",
            "price": "meta_price",
            "image": "post_thumbnail_url",
            "category": "meta_category",
            "featured": "meta_featured",
            "link": "post_permalink"
          }
        }
      },
      {
        "name": "testimonials",
        "props": {
          "title": "Lo que dicen nuestros clientes",
          "subtitle": "Testimonios reales de quienes han confiado en nosotros"
        },
        "dataSource": {
          "type": "wordpress_posts",
          "postType": "testimonio",
          "query": {
            "numberposts": 6,
            "post_status": "publish",
            "meta_query": [
              {
                "key": "product_testimonial",
                "value": "true",
                "compare": "="
              }
            ]
          },
          "mapping": {
            "name": "post_title",
            "role": "post_excerpt",
            "content": "post_content",
            "rating": "meta_rating",
            "avatar": "meta_avatar",
            "course": "meta_product"
          }
        }
      }
    ]
  },
  "page-contacto": {
    "title": "Contacto",
    "description": "Ponte en contacto con nosotros",
    "components": [
      {
        "name": "hero-section",
        "props": {
          "title": "Contáctanos",
          "subtitle": "Estamos aquí para ayudarte en tu camino creativo",
          "ctaText": "Enviar mensaje",
          "backgroundImage": ""
        },
        "seo": {
          "title": "Contacto | Toulouse Lautrec",
          "description": "Ponte en contacto con nosotros. Estamos aquí para ayudarte en tu camino creativo.",
          "keywords": "contacto, Toulouse Lautrec, información, ayuda",
          "ogImage": "",
          "canonical": "/contacto"
        },
        "analytics": {
          "pageView": "page_view_contacto",
          "events": [
            {
              "name": "contact_form_submit",
              "category": "conversion",
              "action": "submit",
              "label": "contact_form"
            }
          ]
        }
      }
    ]
  }
}
```

### Paso 5: Crear Extensión Personalizada

Vamos a crear una extensión que agregue funcionalidad avanzada a nuestros product cards.

#### 5.1 Crear la extensión

```bash
touch src/extensions/product-analytics-extension.js
```

#### 5.2 Implementar la extensión

```javascript
// src/extensions/product-analytics-extension.js
/**
 * Extensión de Analytics para Product Cards
 * 
 * Esta extensión agrega tracking automático, wishlist,
 * comparación de productos y recomendaciones relacionadas.
 */

module.exports = function(config) {
  return {
    name: 'product-analytics-extension',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        if (component.name === 'product-card') {
          // Preparar datos de analytics
          context.productAnalytics = {
            timestamp: new Date().toISOString(),
            pageType: '<?php echo get_post_type(); ?>',
            userId: '<?php echo get_current_user_id(); ?>',
            sessionId: '<?php echo session_id(); ?>'
          };
          
          console.log('🔧 Preparando analytics para product-card');
        }
      },

      afterComponentRender: async function(component, context, result) {
        if (component.name === 'product-card') {
          // Agregar funcionalidades avanzadas
          const enhancedResult = this.enhanceProductCard(result, context.productAnalytics);
          return enhancedResult;
        }
        
        return result;
      }
    },
    
    // Métodos de la extensión
    enhanceProductCard: function(result, analyticsData) {
      // Agregar botones de wishlist y comparar
      const enhancedResult = result.replace(
        '</div>',
        `
        <div class="product-actions">
          <button class="wishlist-btn" onclick="toggleWishlist(this)" data-product-id="<?php echo get_the_ID(); ?>">
            ❤️ Favorito
          </button>
          <button class="compare-btn" onclick="toggleCompare(this)" data-product-id="<?php echo get_the_ID(); ?>">
            ⚖️ Comparar
          </button>
        </div>
        </div>`
      );

      // Agregar JavaScript para funcionalidades
      return enhancedResult + `
      <script>
      // Analytics automático para product cards
      document.addEventListener('DOMContentLoaded', function() {
        const productCard = document.querySelector('.product-card[data-product-id="<?php echo get_the_ID(); ?>"]');
        if (productCard) {
          // Track product view
          gtag('event', 'view_item', {
            'currency': 'PEN',
            'value': '<?php echo get_post_meta(get_the_ID(), "price", true) ?: 0; ?>',
            'items': [{
              'item_id': '<?php echo get_the_ID(); ?>',
              'item_name': '<?php echo get_the_title(); ?>',
              'item_category': '<?php echo get_post_meta(get_the_ID(), "category", true) ?: "producto"; ?>',
              'quantity': 1
            }]
          });

          // Track product interactions
          productCard.addEventListener('click', function(e) {
            if (e.target.classList.contains('product-link')) {
              gtag('event', 'select_item', {
                'item_list_id': 'product_grid',
                'item_list_name': 'Product Grid',
                'items': [{
                  'item_id': '<?php echo get_the_ID(); ?>',
                  'item_name': '<?php echo get_the_title(); ?>'
                }]
              });
            }
          });
        }
      });

      // Wishlist functionality
      function toggleWishlist(button) {
        const productId = button.getAttribute('data-product-id');
        const isInWishlist = button.classList.contains('in-wishlist');
        
        if (isInWishlist) {
          // Remove from wishlist
          button.textContent = '❤️ Favorito';
          button.classList.remove('in-wishlist');
          removeFromWishlist(productId);
          
          gtag('event', 'remove_from_wishlist', {
            'currency': 'PEN',
            'value': getProductPrice(productId),
            'items': [{
              'item_id': productId,
              'item_name': getProductTitle(productId)
            }]
          });
        } else {
          // Add to wishlist
          button.textContent = '💖 En favoritos';
          button.classList.add('in-wishlist');
          addToWishlist(productId);
          
          gtag('event', 'add_to_wishlist', {
            'currency': 'PEN',
            'value': getProductPrice(productId),
            'items': [{
              'item_id': productId,
              'item_name': getProductTitle(productId)
            }]
          });
        }
      }

      // Compare functionality
      function toggleCompare(button) {
        const productId = button.getAttribute('data-product-id');
        const isInCompare = button.classList.contains('in-compare');
        
        if (isInCompare) {
          button.textContent = '⚖️ Comparar';
          button.classList.remove('in-compare');
          removeFromCompare(productId);
        } else {
          const compareList = getCompareList();
          if (compareList.length >= 3) {
            alert('Máximo 3 productos para comparar');
            return;
          }
          
          button.textContent = '✓ En comparación';
          button.classList.add('in-compare');
          addToCompare(productId);
          
          gtag('event', 'add_to_compare', {
            'event_category': 'engagement',
            'event_label': productId
          });
        }
        
        updateCompareCounter();
      }

      // Utility functions
      function addToWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (!wishlist.includes(productId)) {
          wishlist.push(productId);
          localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
      }

      function removeFromWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        wishlist = wishlist.filter(id => id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      }

      function addToCompare(productId) {
        let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
        if (!compareList.includes(productId)) {
          compareList.push(productId);
          localStorage.setItem('compareList', JSON.stringify(compareList));
        }
      }

      function removeFromCompare(productId) {
        let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
        compareList = compareList.filter(id => id !== productId);
        localStorage.setItem('compareList', JSON.stringify(compareList));
      }

      function getCompareList() {
        return JSON.parse(localStorage.getItem('compareList') || '[]');
      }

      function updateCompareCounter() {
        const compareList = getCompareList();
        const counter = document.querySelector('.compare-counter');
        if (counter) {
          counter.textContent = compareList.length;
          counter.style.display = compareList.length > 0 ? 'inline' : 'none';
        }
      }

      function getProductPrice(productId) {
        // En implementación real, esto vendría de PHP
        return 0; // placeholder
      }

      function getProductTitle(productId) {
        // En implementación real, esto vendría de PHP  
        return ''; // placeholder
      }

      // Initialize wishlist/compare states
      document.addEventListener('DOMContentLoaded', function() {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
        
        // Update wishlist buttons
        wishlist.forEach(productId => {
          const button = document.querySelector(\`.wishlist-btn[data-product-id="\${productId}"]\`);
          if (button) {
            button.textContent = '💖 En favoritos';
            button.classList.add('in-wishlist');
          }
        });
        
        // Update compare buttons
        compareList.forEach(productId => {
          const button = document.querySelector(\`.compare-btn[data-product-id="\${productId}"]\`);
          if (button) {
            button.textContent = '✓ En comparación';
            button.classList.add('in-compare');
          }
        });
        
        updateCompareCounter();
      });
      </script>

      <style>
      .product-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--tl-neutral-200);
      }

      .wishlist-btn,
      .compare-btn {
        flex: 1;
        padding: 0.5rem 1rem;
        border: 1px solid var(--tl-neutral-300);
        background: white;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .wishlist-btn:hover,
      .compare-btn:hover {
        background: var(--tl-neutral-50);
        border-color: var(--tl-primary-300);
      }

      .wishlist-btn.in-wishlist {
        background: var(--tl-red-50);
        border-color: var(--tl-red-300);
        color: var(--tl-red-600);
      }

      .compare-btn.in-compare {
        background: var(--tl-blue-50);
        border-color: var(--tl-blue-300);
        color: var(--tl-blue-600);
      }
      </style>`;
    },

    customHooks: {
      'getProductRecommendations': async function(productId, limit = 4) {
        return `
        <?php
        // Obtener productos relacionados
        \$current_product = get_post(${productId});
        \$category = get_post_meta(${productId}, 'category', true);
        
        \$related_products = get_posts(array(
          'post_type' => 'producto',
          'posts_per_page' => ${limit},
          'post__not_in' => array(${productId}),
          'meta_query' => array(
            array(
              'key' => 'category',
              'value' => \$category,
              'compare' => '='
            )
          )
        ));
        
        if (!empty(\$related_products)) {
          echo '<div class="related-products">';
          echo '<h3>Productos relacionados</h3>';
          echo '<div class="related-products-grid">';
          
          foreach (\$related_products as \$related_product) {
            setup_postdata(\$related_product);
            render_product_card(
              get_the_title(),
              get_the_excerpt(),
              get_post_meta(get_the_ID(), 'price', true),
              get_the_post_thumbnail_url(get_the_ID(), 'medium'),
              get_post_meta(get_the_ID(), 'category', true),
              get_post_meta(get_the_ID(), 'featured', true),
              get_permalink(),
              'Ver producto'
            );
          }
          
          echo '</div>';
          echo '</div>';
          wp_reset_postdata();
        }
        ?>`;
      }
    }
  };
};
```

### Paso 6: Generar Tema WordPress

#### 6.1 Generar el tema

```bash
npm run wp:generate
```

Deberías ver logs similares a:

```
🚀 Iniciando generación de tema WordPress avanzado...
🧹 Limpiando directorio de salida anterior...
📁 No se encontró carpeta de extensiones, creando...
✅ Extensión cargada: product-analytics-extension.js
🏗️ Creando estructura del tema...
✅ Convertido: hero-section
✅ Convertido: course-card
✅ Convertido: product-card
✅ Convertido: testimonials
✅ Convertido: feature-grid
✅ Convertido: interactive-gallery
🎨 Copiando assets CSS...
📦 Copiando assets JavaScript...
📝 Generando plantillas WordPress...
🔍 Generando SEO dinámico...
✅ Validación completada exitosamente
✅ Tema WordPress avanzado generado y validado exitosamente!
```

#### 6.2 Verificar estructura generada

```bash
tree wordpress-output/toulouse-lautrec -I node_modules
```

Deberías ver:

```
wordpress-output/toulouse-lautrec/
├── assets/
│   ├── css/
│   │   ├── design-tokens.css
│   │   └── toulouse-design-system.css
│   └── js/
│       └── toulouse-ds.js
├── components/
│   ├── hero-section/
│   │   └── hero-section.php
│   ├── course-card/
│   │   └── course-card.php
│   ├── product-card/
│   │   └── product-card.php
│   ├── testimonials/
│   │   └── testimonials.php
│   ├── feature-grid/
│   │   └── feature-grid.php
│   └── interactive-gallery/
│       └── interactive-gallery.php
├── functions.php
├── style.css
├── index.php
├── front-page.php
├── header.php
├── footer.php
├── page-carreras.php
├── page-productos.php
├── page-contacto.php
└── single-producto.php
```

### Paso 7: Validar y Probar

#### 7.1 Validación Automática de Sintaxis PHP 🔒

El sistema incluye validación automática que se ejecuta durante la generación:

```bash
# Generación con validación automática integrada
npm run wp:generate
```

**Salida esperada con validación exitosa:**
```
🚀 Iniciando generación de tema WordPress avanzado...
🐘 PHP detectado: PHP 8.4.4 (cli)
✅ Convertido: product-card
✅ Todos los templates generados correctamente
🔍 Validando sintaxis PHP...

📊 Reporte de Validación PHP
══════════════════════════════════════════════════
📁 Archivos totales: 19
✅ Archivos válidos: 19  
❌ Errores encontrados: 0
📈 Tasa de éxito: 100.0%

🎉 ¡Todos los archivos PHP tienen sintaxis correcta!
✅ Tema WordPress avanzado generado y validado exitosamente!
```

#### 7.2 Validación Interactiva de PHP

Para validación más detallada con sugerencias:

```bash
npm run wp:validate-php
```

#### 7.3 Validar tema completo

```bash
npm run wp:validate
```

#### 7.2 Verificar componente específico

```bash
cat wordpress-output/toulouse-lautrec/components/product-card/product-card.php
```

Deberías ver código PHP como:

```php
<?php
/**
 * Product Card Component - Generado automáticamente
 */

function render_product_card($title = '', $description = '', $price = '', $image = '', $category = '', $featured = false, $link = '', $link_text = 'Ver más') {
    ?>
    <div class="product-card <?php echo $featured ? 'featured' : ''; ?>">
        <?php if ($image): ?>
            <img class="product-image" src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>" loading="lazy" />
        <?php endif; ?>
        
        <?php if ($category): ?>
            <div class="product-category"><?php echo esc_html($category); ?></div>
        <?php endif; ?>
        
        <h3 class="product-title"><?php echo esc_html($title); ?></h3>
        
        <?php if ($description): ?>
            <p class="product-description"><?php echo esc_html($description); ?></p>
        <?php endif; ?>
        
        <?php if ($price): ?>
            <div class="product-price"><?php echo esc_html($price); ?></div>
        <?php endif; ?>
        
        <?php if ($link): ?>
            <a href="<?php echo esc_url($link); ?>" class="product-link">
                <?php echo esc_html($link_text); ?>
            </a>
        <?php endif; ?>
        
        <!-- Agregado por extensión -->
        <div class="product-actions">
            <button class="wishlist-btn" onclick="toggleWishlist(this)" data-product-id="<?php echo get_the_ID(); ?>">
                ❤️ Favorito
            </button>
            <button class="compare-btn" onclick="toggleCompare(this)" data-product-id="<?php echo get_the_ID(); ?>">
                ⚖️ Comparar
            </button>
        </div>
    </div>
    
    <script>
    // JavaScript generado por la extensión
    // ... código de analytics y funcionalidades
    </script>
    <?php
}
?>
```

#### 7.4 Manejo de Errores de Validación

Si el sistema detecta errores durante la generación:

**Ejemplo de error detectado:**
```
❌ Errores de Sintaxis PHP:
──────────────────────────────────────────────────
📄 components/product-card/product-card.php
   └─ Línea 15: syntax error, unexpected identifier "config"
   └─ Solución: JavaScript keywords en contexto PHP detectado

🧹 Rollback completado. No se dejaron archivos con errores.
```

**Cómo solucionar:**
1. El sistema automáticamente limpia archivos con errores
2. Revisa la extensión o componente que puede estar generando código problemático
3. Ejecuta nuevamente la generación después de corregir

**Verificar corrección:**
```bash
# Regenerar después del fix
npm run wp:generate

# Validación específica
npm run wp:validate-php
```

#### 7.5 Probar en WordPress local (opcional)

Si tienes WordPress local:

```bash
# Copiar tema a WordPress
cp -r wordpress-output/toulouse-lautrec /path/to/wp-content/themes/

# O crear symlink para desarrollo continuo  
ln -s $(pwd)/wordpress-output/toulouse-lautrec /path/to/wp-content/themes/toulouse-lautrec
```

1. **Activa el tema** en WordPress Admin
2. **Crea posts** del tipo "Producto" 
3. **Crea página** usando template "Productos"
4. **Verifica funcionamiento** de wishlist y compare
5. **Confirma** que no hay errores PHP en WordPress debug.log

## 🔧 Personalización Avanzada

### Agregar Campos Personalizados para Testimonios

Para agregar campos personalizados que funcionen con los componentes actuales, agrega esto a `functions.php`:

```php
// Campos personalizados para testimonios
function toulouse_add_testimonial_meta_boxes() {
    add_meta_box(
        'testimonial_details',
        'Detalles del Testimonio',
        'toulouse_testimonial_meta_box_callback',
        'testimonio'
    );
}
add_action('add_meta_boxes', 'toulouse_add_testimonial_meta_boxes');

function toulouse_testimonial_meta_box_callback($post) {
    wp_nonce_field('toulouse_save_testimonial_meta', 'toulouse_testimonial_meta_nonce');
    
    $rating = get_post_meta($post->ID, 'rating', true) ?: '5';
    $avatar = get_post_meta($post->ID, 'avatar', true);
    $course = get_post_meta($post->ID, 'course', true);
    
    echo '<table class="form-table">';
    echo '<tr><th><label for="testimonial_rating">Calificación (1-5)</label></th>';
    echo '<td><input type="number" id="testimonial_rating" name="testimonial_rating" min="1" max="5" value="' . esc_attr($rating) . '" /></td></tr>';
    echo '<tr><th><label for="testimonial_avatar">URL del Avatar</label></th>';
    echo '<td><input type="url" id="testimonial_avatar" name="testimonial_avatar" value="' . esc_attr($avatar) . '" class="regular-text" /></td></tr>';
    echo '<tr><th><label for="testimonial_course">Curso/Carrera</label></th>';
    echo '<td><input type="text" id="testimonial_course" name="testimonial_course" value="' . esc_attr($course) . '" class="regular-text" /></td></tr>';
    echo '</table>';
}

function toulouse_save_testimonial_meta($post_id) {
    if (!isset($_POST['toulouse_testimonial_meta_nonce']) || 
        !wp_verify_nonce($_POST['toulouse_testimonial_meta_nonce'], 'toulouse_save_testimonial_meta')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (isset($_POST['testimonial_rating'])) {
        $rating = intval($_POST['testimonial_rating']);
        $rating = max(1, min(5, $rating)); // Asegurar que esté entre 1-5
        update_post_meta($post_id, 'rating', $rating);
    }

    if (isset($_POST['testimonial_avatar'])) {
        update_post_meta($post_id, 'avatar', esc_url($_POST['testimonial_avatar']));
    }

    if (isset($_POST['testimonial_course'])) {
        update_post_meta($post_id, 'course', sanitize_text_field($_POST['testimonial_course']));
    }
}
add_action('save_post', 'toulouse_save_testimonial_meta');
```

### Crear Shortcodes para Componentes

```php
// Shortcode para hero-section
function toulouse_hero_section_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => 'Título por defecto',
        'subtitle' => 'Subtítulo por defecto',
        'cta_text' => 'Conocer más',
        'background_image' => ''
    ), $atts);

    ob_start();
    render_hero_section(
        $atts['title'],
        $atts['subtitle'],
        $atts['cta_text'],
        $atts['background_image']
    );
    return ob_get_clean();
}
add_shortcode('hero_section', 'toulouse_hero_section_shortcode');

// Shortcode para testimonials
function toulouse_testimonials_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => 'Testimonios',
        'subtitle' => 'Lo que dicen nuestros estudiantes',
        'limit' => 6
    ), $atts);

    $testimonials = get_posts(array(
        'post_type' => 'testimonio',
        'posts_per_page' => intval($atts['limit']),
        'post_status' => 'publish'
    ));

    $testimonials_data = array();
    foreach ($testimonials as $testimonial) {
        setup_postdata($testimonial);
        $testimonials_data[] = array(
            'name' => get_the_title(),
            'role' => get_the_excerpt(),
            'content' => get_the_content(),
            'rating' => get_post_meta(get_the_ID(), 'rating', true) ?: '5',
            'avatar' => get_post_meta(get_the_ID(), 'avatar', true) ?: '',
            'course' => get_post_meta(get_the_ID(), 'course', true) ?: ''
        );
    }
    wp_reset_postdata();

    ob_start();
    render_testimonials($atts['title'], $atts['subtitle'], $testimonials_data);
    return ob_get_clean();
}
add_shortcode('testimonials', 'toulouse_testimonials_shortcode');

// Shortcode para course-card
function toulouse_course_cards_shortcode($atts) {
    $atts = shortcode_atts(array(
        'limit' => -1,
        'orderby' => 'date',
        'order' => 'DESC'
    ), $atts);

    $courses = get_posts(array(
        'post_type' => 'carrera',
        'posts_per_page' => intval($atts['limit']),
        'orderby' => $atts['orderby'],
        'order' => $atts['order'],
        'post_status' => 'publish'
    ));

    if (empty($courses)) {
        return '<p>No se encontraron carreras.</p>';
    }

    ob_start();
    echo '<div class="course-cards-grid">';
    
    foreach ($courses as $course) {
        setup_postdata($course);
        render_course_card(
            get_the_title(),
            get_the_excerpt(),
            get_the_post_thumbnail_url(get_the_ID(), 'medium'),
            get_permalink(),
            'Ver carrera'
        );
    }
    wp_reset_postdata();
    
    echo '</div>';
    return ob_get_clean();
}
add_shortcode('course_cards', 'toulouse_course_cards_shortcode');
```

### Uso de los Shortcodes

```
<!-- Hero Section personalizado -->
[hero_section title="Bienvenido" subtitle="Descubre nuestros cursos" cta_text="Explorar"]

<!-- Testimonios limitados -->
[testimonials title="Testimonios Destacados" limit="3"]

<!-- Tarjetas de carreras -->
[course_cards limit="4" order="ASC"]
```

### Sistema de Extensiones

El sistema incluye un potente sistema de extensiones que permite agregar funcionalidades sin modificar el código base:

#### Crear una Extensión Personalizada

Crea un archivo en `src/extensions/mi-extension.js`:

```javascript
module.exports = function(config) {
  return {
    name: 'mi-extension',
    
    hooks: {
      // Se ejecuta antes de renderizar un componente
      beforeComponentRender: (component, context) => {
        console.log(`Renderizando: ${component.name}`);
        return { component, context };
      },
      
      // Se ejecuta después de renderizar un componente
      afterComponentRender: (component, context, result) => {
        // Agregar analytics personalizado
        const analyticsCode = `
          <!-- Analytics personalizado para ${component.name} -->
          <script>
            console.log('Componente ${component.name} renderizado');
          </script>
        `;
        
        return result + analyticsCode;
      },
      
      // Se ejecuta antes de generar un template
      beforeTemplateGeneration: (templateName, context) => {
        console.log(`Generando template: ${templateName}`);
        return { templateName, context };
      },
      
      // Se ejecuta después de generar un template
      afterTemplateGeneration: (templateName, context, result) => {
        console.log(`Template ${templateName} generado exitosamente`);
        return result;
      }
    },
    
    // Agregar tipos de componentes personalizados
    componentTypes: {
      'custom-banner': {
        render: (props, context) => {
          return `
            <div class="custom-banner">
              <h2>${props.title || 'Banner Personalizado'}</h2>
              <p>${props.message || 'Mensaje del banner'}</p>
            </div>
          `;
        }
      }
    }
  };
};
```

#### Extensiones de Analytics Incluidas

El sistema incluye extensiones preconfiguradas para analytics:

- **GA4 Data Layer**: `scripts/wp-generator/extensions/analytics/ga4-data-layer.js`
- **Facebook Pixel**: `scripts/wp-generator/extensions/analytics/facebook-pixel.js`
- **Custom Events**: `scripts/wp-generator/extensions/analytics/custom-events.js`

#### Configurar Analytics

Edita `scripts/wp-generator/core/config.js` para habilitar analytics:

```javascript
analytics: {
  enabled: true,
  googleAnalytics: {
    measurementId: 'G-TU-MEASUREMENT-ID',
    enabled: true
  },
  facebookPixel: {
    pixelId: 'TU-PIXEL-ID',
    enabled: true
  },
  customEvents: {
    pageViews: true,
    componentViews: true,
    interactions: true
  }
}
```

### Validación de Configuración

El sistema incluye validación estricta que detecta inconsistencias:

```bash
# Validar solo el renderizado de componentes
npm run wp:validate:render

# Validación completa (híbrida)
npm run wp:validate

# Generar con validación estricta (falla si hay inconsistencias)
npm run wp:generate
```

## 🚀 Despliegue en Producción

### Build de Producción

```bash
# Build optimizado
npm run build

# Generar tema final
npm run wp:generate

# Verificar que todo está correcto
npm run wp:validate
```

### Subir a Servidor

```bash
# Comprimir tema
cd wordpress-output
zip -r toulouse-lautrec.zip toulouse-lautrec/

# Subir via FTP/SSH
scp toulouse-lautrec.zip user@servidor:/tmp/

# En el servidor
cd /var/www/html/wp-content/themes/
unzip /tmp/toulouse-lautrec.zip
```

### Configuración de Producción

1. **Activar tema** en WordPress Admin
2. **Crear contenido de ejemplo**:
   - Productos con todas las propiedades
   - Páginas usando los templates
   - Menús de navegación
3. **Configurar analytics** (Google Analytics/Tag Manager)
4. **Verificar performance** con PageSpeed Insights
5. **Testear funcionalidades** de wishlist y compare

## 🛠️ Troubleshooting

### Problema: Componente no se genera

**Síntoma**: Error "No se encontró metadata para el componente"

**Solución**:
1. Verificar que existe entrada en `component-metadata.json`
2. Verificar sintaxis JSON válida
3. Limpiar cache: `rm -rf wordpress-output && npm run wp:generate`

### Problema: Extensión no se carga

**Síntoma**: No aparecen logs de carga de extensión

**Solución**:
1. Verificar que el archivo está en `src/extensions/`
2. Verificar que tiene extensión `.js`
3. Verificar sintaxis del módulo Node.js
4. Revisar logs de error en consola

### Problema: CSS/JS no se carga

**Síntoma**: Estilos no se aplican en WordPress

**Solución**:
1. Verificar que `npm run build` se ejecutó
2. Verificar permisos de directorio `assets/`
3. Verificar que WordPress puede acceder a archivos
4. Limpiar cache del navegador y de WordPress

### Problema: PHP Syntax Error

**Síntoma**: Error 500 en WordPress

**Solución**:
1. Revisar logs de PHP: `tail -f /var/log/php/error.log`
2. Verificar sintaxis en templates generados
3. Verificar que todas las funciones están definidas
4. Regenerar tema: `npm run wp:generate`

### Problema: Posts no aparecen

**Síntoma**: Componentes no muestran contenido

**Solución**:
1. Crear posts del tipo correcto (`producto`, `carrera`, etc.)
2. Verificar que posts están publicados
3. Verificar `componentMapping` en metadata
4. Revisar query en `page-templates.json`

## ✅ Checklist Final

- [ ] Componente Lit funciona en Storybook
- [ ] Metadata configurada correctamente
- [ ] Página WordPress configurada
- [ ] Extensión personalizada creada
- [ ] Tema WordPress generado sin errores
- [ ] Validación pasada exitosamente
- [ ] Componente PHP generado correctamente
- [ ] Funcionalidades de extensión funcionan
- [ ] CSS y JS se cargan correctamente
- [ ] Analytics configurados
- [ ] Shortcode funciona (opcional)
- [ ] Deploy en producción exitoso

## 🎉 ¡Felicitaciones!

Has completado exitosamente el tutorial end-to-end. Ahora tienes:

✅ **Un design system funcional** con componente Lit documentado  
✅ **Generación automática** de código PHP para WordPress  
✅ **Sistema de extensiones** para funcionalidades avanzadas  
✅ **Configuración basada en metadata** sin hardcoding  
✅ **Pipeline completo** desde desarrollo hasta producción  

### Próximos Pasos

1. **Crear más componentes** siguiendo este mismo flujo
2. **Desarrollar extensiones** más complejas 
3. **Configurar CI/CD** para deploy automático
4. **Documentar patrones** específicos de tu proyecto
5. **Entrenar al equipo** en el uso del sistema

### Recursos Adicionales

- [Documentación Lit](https://lit.dev/docs/)
- [WordPress Theme Handbook](https://developer.wordpress.org/themes/)
- [Guía de Extensiones](./EXTENSIONS_GUIDE.md)
- [Documentación del Proyecto](./README.md)

## 🚨 Comportamiento Fail-Fast

### ⚠️ CRÍTICO: Sistema de Rollback Automático

El generador implementa **fail-fast con rollback completo** para garantizar calidad profesional:

#### 🔄 ¿Cuándo ocurre rollback?

1. **Error de sintaxis PHP** en archivos generados
2. **Dependencias faltantes** (Composer, PHPCS, Lighthouse)
3. **Validaciones de calidad fallidas** (PHPCS, managers)
4. **Configuración inconsistente** en metadata.json

#### 🚨 Ejemplo Real: hero-section tipo "aggregated"

**Problema identificado:**
```bash
❌ Error de sintaxis PHP en page-carreras.php. No se escribió el archivo.
❌ Error de sintaxis PHP en page-contacto.php. No se escribió el archivo.
🔄 Haciendo rollback completo...
✅ Rollback completado. No se dejaron archivos con errores.
```

**Causa:** Cambiar `hero-section` de `"type": "static"` a `"type": "aggregated"` sin configuración correcta causó código PHP inválido.

**Resultado del rollback:**
- ✅ Limpió `wordpress-output` completamente
- ✅ NO dejó archivos parciales o corruptos
- ✅ Sistema queda en estado limpio
- ✅ Error reportado claramente

#### ✅ Comportamiento Profesional Correcto

**POR QUÉ ES BUENO:**
1. **Calidad garantizada**: Solo genera código que funciona 100%
2. **No archivos corruptos**: Rollback automático previene estados inconsistentes
3. **Debugging claro**: Mensajes específicos sobre qué falló
4. **Estado limpio**: Siempre puedes volver a generar desde cero

#### 🔧 Cómo Resolver Errores

**1. Leer mensajes de error específicos:**
```bash
❌ Error crítico durante la generación: VALIDACIONES DE CALIDAD FALLARON
```

**2. Revisar configuraciones antes de generar:**
- ✅ Metadata.json coherente con tipos de componente
- ✅ page-templates.json compatible con metadata
- ✅ Dependencias instaladas (npm run setup)

**3. Usar Node.js correcto:**
```bash
nvm use 24  # OBLIGATORIO antes de npm run wp:generate
```

#### 📋 Tipos de Componente vs DataSource

| Tipo Componente | Configuración Soportada | DataSource | Resultado |
|------|---------------|-----|-----------|
| `static` | Solo `props` | ❌ NO soportado | Valores fijos hardcodeados |
| `iterative` | `dataSource` | ✅ Sí | Loops WordPress dinámicos |
| `aggregated` | `dataSource` + `aggregation` | ✅ Sí | Arrays de datos |
| `comprehensive` | Complejo | ✅ Sí | Múltiples fuentes |

#### 🚨 Limitaciones Críticas del Sistema

**❌ INCOMPATIBLE: `"type": "static"` + `dataSource`**
- Los componentes estáticos NO pueden usar dataSource
- Error: "Parámetro esperado pero no proporcionado"
- Solo funcionan con `props` hardcodeados

**✅ TIPOS VÁLIDOS DE DATASOURCE:**
```javascript
validTypes: ['post', 'page', 'custom', 'api']
```

**❌ TIPOS INVÁLIDOS:**
- `"wordpress_posts"` → Usar `"post"`
- `"wordpress_page"` → Usar `"page"`

#### 🎯 Recomendación

**SIEMPRE probar configuraciones gradualmente:**
1. Empezar con `"type": "static"` y `props` hardcodeados
2. Cambiar a dinámico solo cuando esté funcionando
3. Un cambio a la vez, no múltiples simultáneos

**El fail-fast es tu amigo - te protege de deployar código roto.**

---

**¿Preguntas o problemas?** Consulta con el equipo de desarrollo o crea un issue en el repositorio.