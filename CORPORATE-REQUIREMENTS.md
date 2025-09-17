# 🏢 Requerimientos para Sitio Corporativo Público

## 🌍 **1. INTERNACIONALIZACIÓN (i18n)**

### **Estado Actual**
- ❌ Strings hardcodeados en español
- ❌ Sin estructura de traducción
- ❌ Solo text-domain básico de WordPress

### **Implementación Requerida**

#### **1.1 Estructura de Traducción**
```json
// src/i18n/translations.json
{
  "es": {
    "hero.title": "Bienvenidos a Toulouse",
    "hero.cta": "Comenzar",
    "testimonials.title": "Lo que dicen nuestros estudiantes",
    "course.viewMore": "Ver carrera"
  },
  "en": {
    "hero.title": "Welcome to Toulouse",
    "hero.cta": "Get Started",
    "testimonials.title": "What our students say",
    "course.viewMore": "View course"
  },
  "fr": {
    "hero.title": "Bienvenue chez Toulouse",
    "hero.cta": "Commencer",
    "testimonials.title": "Ce que disent nos étudiants",
    "course.viewMore": "Voir le cours"
  }
}
```

#### **1.2 Actualizar Componentes Lit**
```javascript
// src/components/hero-section/hero-section.js
import { translations } from '../../i18n/translations.js';

class HeroSection extends LitElement {
  static properties = {
    title: { type: String },
    locale: { type: String }
  };

  constructor() {
    super();
    this.locale = 'es'; // Por defecto
  }

  t(key) {
    return translations[this.locale]?.[key] || key;
  }

  render() {
    return html`
      <h1>${this.title || this.t('hero.title')}</h1>
      <button>${this.t('hero.cta')}</button>
    `;
  }
}
```

#### **1.3 WordPress i18n Manager**
```javascript
// scripts/wp-generator/managers/i18n-manager.js
class I18nManager {
  generateTranslationFiles(translations) {
    // Generar .po/.pot files para WordPress
    // WPML/Polylang integration
    // Generar functions.php con load_theme_textdomain()
  }

  updatePHPComponents(componentCode, locale) {
    // Reemplazar strings por __('key', 'textdomain')
    return componentCode.replace(
      /['"]([^'"]+)['"]/g,
      "__('" + '$1' + "', 'toulouse-lautrec')"
    );
  }
}
```

---

## ♿ **2. ACCESIBILIDAD (a11y)**

### **Estado Actual**
- ❌ Sin validación automática de accesibilidad
- ❌ ARIA labels no implementados
- ❌ Contrast ratios no verificados

### **Implementación Requerida**

#### **2.1 Accesibilidad en Componentes Lit**
```javascript
// src/components/testimonials/testimonials.js
render() {
  return html`
    <section
      class="testimonials-section"
      role="region"
      aria-labelledby="testimonials-heading"
    >
      <h2 id="testimonials-heading" class="sr-only">
        ${this.t('testimonials.title')}
      </h2>

      <div class="testimonials-grid" role="list">
        ${this.testimonials.map((item, index) => html`
          <article
            class="testimonial-card"
            role="listitem"
            aria-labelledby="testimonial-${index}-author"
          >
            <div class="rating" role="img" aria-label="${item.rating} de 5 estrellas">
              ${this.renderStars(item.rating)}
            </div>

            <blockquote>
              <p>"${item.content}"</p>
              <cite id="testimonial-${index}-author">
                <strong>${item.name}</strong>
                <span class="role">${item.role}</span>
              </cite>
            </blockquote>

            ${item.user_photo ? html`
              <img
                src="${item.user_photo}"
                alt="${this.t('testimonials.photoAlt', { name: item.name })}"
                loading="lazy"
                class="author-avatar"
              />
            ` : ''}
          </article>
        `)}
      </div>
    </section>
  `;
}
```

#### **2.2 A11y Manager**
```javascript
// scripts/wp-generator/managers/a11y-manager.js
class A11yManager {
  validateAccessibility(componentHTML) {
    const issues = [];

    // Verificar ARIA labels
    if (!componentHTML.includes('aria-label')) {
      issues.push('Missing ARIA labels');
    }

    // Verificar headings hierarchy
    const headings = componentHTML.match(/<h[1-6]/g);
    if (headings && !this.isValidHeadingHierarchy(headings)) {
      issues.push('Invalid heading hierarchy');
    }

    return issues;
  }

  generateA11yStyles() {
    return `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* High contrast focus indicators */
      button:focus, a:focus, input:focus {
        outline: 2px solid var(--tl-focus-color, #0066cc);
        outline-offset: 2px;
      }

      /* Motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
  }
}
```

---

## 🎯 **3. SEO AVANZADO PARA EQUIPOS**

### **Estado Actual**
- ✅ Meta tags básicos
- ❌ Sin interfaz para equipos SEO
- ❌ Sin validación de contenido SEO

### **Implementación Requerida**

#### **3.1 SEO Fields en ACF**
```php
// Auto-generado en inc/seo-fields.php
acf_add_local_field_group(array(
  'key' => 'group_seo_fields',
  'title' => 'SEO Configuration',
  'fields' => array(
    array(
      'key' => 'field_meta_title',
      'label' => 'Meta Title',
      'name' => 'meta_title',
      'type' => 'text',
      'instructions' => 'Recommended: 50-60 characters',
      'maxlength' => 60
    ),
    array(
      'key' => 'field_meta_description',
      'label' => 'Meta Description',
      'name' => 'meta_description',
      'type' => 'textarea',
      'instructions' => 'Recommended: 150-160 characters',
      'maxlength' => 160
    ),
    array(
      'key' => 'field_schema_type',
      'label' => 'Schema.org Type',
      'name' => 'schema_type',
      'type' => 'select',
      'choices' => array(
        'Article' => 'Article',
        'Service' => 'Service',
        'Organization' => 'Organization',
        'LocalBusiness' => 'Local Business'
      )
    ),
    array(
      'key' => 'field_canonical_url',
      'label' => 'Canonical URL',
      'name' => 'canonical_url',
      'type' => 'url'
    )
  ),
  'location' => array(array(array(
    'param' => 'post_type',
    'operator' => '==',
    'value' => 'page'
  )))
));
```

#### **3.2 SEO Dashboard**
```javascript
// scripts/wp-generator/managers/seo-dashboard.js
class SEODashboard {
  generateSEOReport(pages) {
    return {
      issues: [
        {
          page: '/carreras/',
          issue: 'Meta description too short (89 chars)',
          severity: 'warning',
          recommendation: 'Expand to 150-160 characters'
        }
      ],
      opportunities: [
        {
          page: '/contacto/',
          opportunity: 'Add structured data for Organization',
          impact: 'high'
        }
      ]
    };
  }
}
```

---

## 🚀 **4. PERFORMANCE CORPORATIVO**

### **Estado Actual**
- ✅ Assets optimizados con Vite
- ❌ Sin CDN integration
- ❌ Sin cache strategy

### **Implementación Requerida**

#### **4.1 CDN Manager**
```javascript
// scripts/wp-generator/managers/cdn-manager.js
class CDNManager {
  generateAssetURLs(assets, cdnConfig) {
    return assets.map(asset => ({
      ...asset,
      url: `${cdnConfig.baseURL}/${asset.path}`,
      fallback: asset.localPath
    }));
  }

  generateCacheHeaders() {
    return `
      # .htaccess cache headers
      <IfModule mod_expires.c>
        ExpiresActive on
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 month"
        ExpiresByType image/jpg "access plus 1 month"
        ExpiresByType image/jpeg "access plus 1 month"
        ExpiresByType image/gif "access plus 1 month"
        ExpiresByType image/svg+xml "access plus 1 month"
      </IfModule>
    `;
  }
}
```

---

## 📊 **5. ANALYTICS CORPORATIVO**

### **Estado Actual**
- ✅ Google Analytics 4 básico
- ❌ Sin goals/conversions tracking
- ❌ Sin custom dimensions

### **Implementación Requerida**

#### **5.1 Enhanced Analytics**
```javascript
// extensions/analytics/corporate-analytics.js
class CorporateAnalytics {
  setupAdvancedTracking() {
    return `
      // Enhanced ecommerce for course purchases
      gtag('event', 'purchase', {
        'transaction_id': '${transactionId}',
        'currency': 'PEN',
        'value': ${value},
        'items': [{
          'item_id': '${courseId}',
          'item_name': '${courseName}',
          'category': 'Course',
          'quantity': 1,
          'price': ${price}
        }]
      });

      // Custom dimensions
      gtag('config', 'GA_MEASUREMENT_ID', {
        'custom_map': {
          'custom_parameter_1': 'user_type',
          'custom_parameter_2': 'course_category'
        }
      });
    `;
  }
}
```

---

## 🔒 **6. SEGURIDAD CORPORATIVA**

### **Estado Actual**
- ✅ WordPress security básico (escapado, nonces)
- ❌ Sin CSP (Content Security Policy)
- ❌ Sin rate limiting

### **Implementación Requerida**

#### **6.1 Security Manager**
```javascript
// scripts/wp-generator/managers/security-manager.js
class SecurityManager {
  generateCSPHeaders() {
    return `
      Content-Security-Policy:
        default-src 'self';
        script-src 'self' 'unsafe-inline' *.googletagmanager.com *.google-analytics.com;
        style-src 'self' 'unsafe-inline' fonts.googleapis.com;
        font-src 'self' fonts.gstatic.com;
        img-src 'self' data: *.googleapis.com;
        connect-src 'self' *.google-analytics.com;
    `;
  }

  generateSecurityHeaders() {
    return `
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      X-XSS-Protection: 1; mode=block
      Referrer-Policy: strict-origin-when-cross-origin
    `;
  }
}
```

---

## 📱 **7. RESPONSIVE Y PWA**

### **Estado Actual**
- ✅ Responsive design básico
- ❌ Sin PWA capabilities
- ❌ Sin offline support

### **Implementación Requerida**

#### **7.1 PWA Manager**
```javascript
// scripts/wp-generator/managers/pwa-manager.js
class PWAManager {
  generateManifest() {
    return {
      "name": "Toulouse Lautrec",
      "short_name": "Toulouse",
      "description": "Instituto de educación superior",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#0066cc",
      "icons": [
        {
          "src": "/assets/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    };
  }

  generateServiceWorker() {
    return `
      const CACHE_NAME = 'toulouse-v1';
      const urlsToCache = [
        '/',
        '/assets/css/toulouse-design-system.css',
        '/assets/js/toulouse-ds.js'
      ];

      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
        );
      });
    `;
  }
}
```

---

## 🎯 **PRIORIZACIÓN PARA IMPLEMENTACIÓN**

### **🔥 CRÍTICO (Implementar primero)**
1. **Internacionalización** - Fundamental para audiencia global
2. **Accesibilidad** - Obligatorio legal y ético
3. **SEO avanzado** - Impacto directo en marketing

### **⚡ IMPORTANTE (Implementar segundo)**
4. **Security headers** - Protección corporativa
5. **Performance optimizations** - UX corporativo
6. **Analytics avanzado** - Insights de negocio

### **💡 DESEABLE (Implementar tercero)**
7. **PWA capabilities** - Ventaja competitiva
8. **Advanced caching** - Optimización final

¿Te gustaría que implemente alguna de estas funcionalidades específicas?