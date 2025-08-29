# 📊 Analytics Manager - Guía Completa

Sistema de Analytics completamente separado del SEO Manager, con arquitectura extensible y configuración desde `config.js`.

## 🏗️ Arquitectura Separada

### 📊 Analytics Manager vs 🔍 SEO Manager

| Analytics Manager | SEO Manager |
|-------------------|-------------|
| **Responsabilidad**: Tracking, eventos, medición | **Responsabilidad**: Meta tags, JSON-LD, structured data |
| **Configuración**: `config.js` → `analytics` | **Configuración**: `seo-config.json` |
| **Output**: Scripts GA4, Data Layer, eventos | **Output**: `<meta>` tags, `<script type="application/ld+json">` |
| **Extensiones**: `extensions/analytics/` | **Extensiones**: `templates/seo/` |
| **Archivos PHP**: `inc/analytics-manager.php` | **Archivos PHP**: `inc/seo-manager.php` |

## ⚙️ Configuración Central

### 📄 `scripts/wp-generator/core/config.js`

```javascript
export const config = {
  // Configuración de Analytics completamente separada
  analytics: {
    enabled: true,
    
    // Google Analytics 4
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX', // ⚠️ CONFIGURAR: Tu GA4 Measurement ID
      enabled: true,
      enhancedEcommerce: true,
      dataLayer: {
        courseViews: true,           // Tracking de vistas de cursos
        testimonialViews: true,      // Tracking de vistas de testimonios
        ctaClicks: true,            // Tracking de clicks en CTAs
        scrollDepth: true,          // Tracking de profundidad de scroll
        timeOnPage: true            // Tracking de tiempo en página
      }
    },
    
    // Facebook Pixel (opcional)
    facebookPixel: {
      pixelId: '',                  // ⚠️ CONFIGURAR: Tu Facebook Pixel ID
      enabled: false,
      conversions: {
        leadGeneration: true,       // Eventos de generación de leads
        courseInterest: true        // Eventos de interés en cursos
      }
    },
    
    // Eventos Personalizados
    customEvents: {
      pageViews: true,              // Page views básicos
      componentViews: true,         // Vistas de componentes individuales
      interactions: true,           // Interacciones generales
      performanceTracking: true,   // Web Vitals (LCP, FID, CLS)
      errorTracking: true           // Tracking de errores JavaScript
    }
  }
  
  // SEO completamente separado
  // seo: { ... }
};
```

## 🔧 Implementación Técnica

### 📱 Analytics Manager PHP

**Archivo**: `wordpress-output/toulouse-lautrec/inc/analytics-manager.php`

```php
<?php
class ToulouseAnalyticsManager {
    private $config;
    
    public function __construct($analytics_config) {
        $this->config = $analytics_config;
    }
    
    /**
     * Genera script de Google Analytics 4
     */
    public function generateGA4Script() {
        if (!$this->isAnalyticsEnabled() || !$this->config['googleAnalytics']['enabled']) {
            return '';
        }
        
        $measurement_id = $this->config['googleAnalytics']['measurementId'];
        
        $script = '<script async src="https://www.googletagmanager.com/gtag/js?id=' . esc_attr($measurement_id) . '"></script>';
        $script .= '<script>';
        $script .= 'window.dataLayer = window.dataLayer || [];';
        $script .= 'function gtag(){dataLayer.push(arguments);}';
        $script .= 'gtag("js", new Date());';
        $script .= 'gtag("config", "' . esc_js($measurement_id) . '", {';
        $script .= '  enhanced_measurement: true,';
        $script .= '  page_title: "' . esc_js(get_the_title()) . '",';
        $script .= '  page_location: "' . esc_js(get_permalink()) . '"';
        $script .= '});';
        $script .= '</script>';
        
        return $script;
    }
    
    /**
     * Genera eventos personalizados por componente
     */
    public function generateCustomEvents() {
        if (!$this->isAnalyticsEnabled()) return '';
        
        $events = '';
        
        // Event listeners para componentes
        $events .= '<script>';
        $events .= 'document.addEventListener("DOMContentLoaded", function() {';
        
        // Course Card clicks
        if ($this->config['googleAnalytics']['dataLayer']['courseViews']) {
            $events .= $this->generateCourseTrackingEvents();
        }
        
        // Testimonial views
        if ($this->config['googleAnalytics']['dataLayer']['testimonialViews']) {
            $events .= $this->generateTestimonialTrackingEvents();
        }
        
        // CTA clicks
        if ($this->config['googleAnalytics']['dataLayer']['ctaClicks']) {
            $events .= $this->generateCTATrackingEvents();
        }
        
        $events .= '});';
        $events .= '</script>';
        
        return $events;
    }
    
    /**
     * Carga extensiones de Analytics desde extensions/analytics/
     */
    public function loadAnalyticsExtensions() {
        $extensions_dir = get_template_directory() . '/extensions/analytics/';
        $extensions = ['ga4-data-layer.js', 'facebook-pixel.js', 'custom-events.js'];
        
        $script = '<script>';
        foreach ($extensions as $extension) {
            $extension_path = $extensions_dir . $extension;
            if (file_exists($extension_path)) {
                $script .= file_get_contents($extension_path);
            }
        }
        $script .= '</script>';
        
        return $script;
    }
    
    private function isAnalyticsEnabled() {
        return isset($this->config['enabled']) && $this->config['enabled'] === true;
    }
    
    private function generateCourseTrackingEvents() {
        return '
        document.querySelectorAll(".course-card").forEach(function(card) {
            card.addEventListener("click", function() {
                const courseTitle = card.querySelector(".course-title")?.textContent || "Unknown Course";
                const courseCategory = card.dataset.category || "general";
                
                gtag("event", "course_click", {
                    event_category: "education",
                    course_name: courseTitle,
                    course_category: courseCategory,
                    event_label: "course_card_interaction"
                });
            });
        });
        ';
    }
    
    private function generateTestimonialTrackingEvents() {
        return '
        const testimonialObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const testimonial = entry.target;
                    const authorName = testimonial.querySelector(".author-name")?.textContent || "Anonymous";
                    
                    gtag("event", "testimonial_view", {
                        event_category: "social_proof",
                        testimonial_author: authorName,
                        event_label: "testimonial_in_view"
                    });
                }
            });
        }, { threshold: 0.5 });
        
        document.querySelectorAll(".testimonial-card").forEach(function(testimonial) {
            testimonialObserver.observe(testimonial);
        });
        ';
    }
    
    private function generateCTATrackingEvents() {
        return '
        document.querySelectorAll(".cta-button, .hero-cta, .btn-primary").forEach(function(cta) {
            cta.addEventListener("click", function() {
                const ctaText = cta.textContent || cta.value || "CTA Click";
                const ctaLocation = cta.closest(".hero-section") ? "hero" : 
                                   cta.closest(".course-card") ? "course-card" : "general";
                
                gtag("event", "cta_click", {
                    event_category: "engagement",
                    cta_text: ctaText,
                    cta_location: ctaLocation,
                    event_label: "primary_cta"
                });
            });
        });
        ';
    }
}

// Inicializar Analytics Manager
global $toulouse_analytics;
if (function_exists('toulouse_get_analytics_config')) {
    $analytics_config = toulouse_get_analytics_config();
    $toulouse_analytics = new ToulouseAnalyticsManager($analytics_config);
}
?>
```

## 🔌 Sistema de Extensiones

### 📄 `extensions/analytics/ga4-data-layer.js`

```javascript
/**
 * Google Analytics 4 Data Layer - Eventos Educativos Específicos
 */
const ToulouseGA4DataLayer = {
    /**
     * Tracking de vista de curso con datos educativos
     */
    trackCourseView: function(courseData) {
        gtag('event', 'course_view', {
            event_category: 'education',
            course_name: courseData.title || 'Unknown Course',
            course_category: courseData.category || 'general',
            course_duration: courseData.duration || '',
            course_level: courseData.level || '',
            course_price: courseData.price || '',
            institution: 'Toulouse Lautrec',
            custom_parameter_1: 'design_education',
            value: parseFloat(courseData.price) || 0
        });
    },

    /**
     * Tracking de interacción con testimonios
     */
    trackTestimonialInteraction: function(testimonialData) {
        gtag('event', 'testimonial_engagement', {
            event_category: 'social_proof',
            testimonial_author: testimonialData.name || 'Anonymous',
            testimonial_course: testimonialData.course || '',
            testimonial_rating: testimonialData.rating || 0,
            engagement_type: 'view',
            institution: 'Toulouse Lautrec'
        });
    },

    /**
     * Tracking de formularios de contacto/interés
     */
    trackLeadGeneration: function(formData) {
        gtag('event', 'generate_lead', {
            event_category: 'conversion',
            lead_type: formData.type || 'general_inquiry',
            course_interest: formData.courseInterest || '',
            form_location: formData.source || 'website',
            currency: 'PEN',
            value: 100 // Valor estimado de lead
        });
    },

    /**
     * Tracking de performance web (Core Web Vitals)
     */
    trackWebVitals: function() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                gtag('event', 'web_vitals', {
                    event_category: 'performance',
                    metric_name: 'LCP',
                    metric_value: Math.round(entry.startTime),
                    metric_rating: entry.startTime < 2500 ? 'good' : 
                                  entry.startTime < 4000 ? 'needs_improvement' : 'poor'
                });
            }
        }).observe({entryTypes: ['largest-contentful-paint']});

        // First Input Delay (FID)
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                gtag('event', 'web_vitals', {
                    event_category: 'performance',
                    metric_name: 'FID',
                    metric_value: Math.round(entry.processingStart - entry.startTime),
                    metric_rating: entry.processingStart - entry.startTime < 100 ? 'good' : 
                                  entry.processingStart - entry.startTime < 300 ? 'needs_improvement' : 'poor'
                });
            }
        }).observe({entryTypes: ['first-input']});

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            
            gtag('event', 'web_vitals', {
                event_category: 'performance',
                metric_name: 'CLS',
                metric_value: Math.round(clsValue * 1000),
                metric_rating: clsValue < 0.1 ? 'good' : 
                              clsValue < 0.25 ? 'needs_improvement' : 'poor'
            });
        }).observe({entryTypes: ['layout-shift']});
    },

    /**
     * Scroll depth tracking
     */
    trackScrollDepth: function() {
        const scrollThresholds = [25, 50, 75, 90, 100];
        const trackedThresholds = new Set();

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
                    trackedThresholds.add(threshold);
                    
                    gtag('event', 'scroll_depth', {
                        event_category: 'engagement',
                        scroll_depth: threshold,
                        page_title: document.title,
                        event_label: `${threshold}%_scroll`
                    });
                }
            });
        });
    },

    /**
     * Time on page tracking
     */
    trackTimeOnPage: function() {
        const startTime = Date.now();
        const timeThresholds = [30, 60, 120, 300]; // seconds
        const trackedTimeThresholds = new Set();

        setInterval(() => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            
            timeThresholds.forEach(threshold => {
                if (timeOnPage >= threshold && !trackedTimeThresholds.has(threshold)) {
                    trackedTimeThresholds.add(threshold);
                    
                    gtag('event', 'time_on_page', {
                        event_category: 'engagement',
                        time_threshold: threshold,
                        page_title: document.title,
                        event_label: `${threshold}s_engaged`
                    });
                }
            });
        }, 1000);

        // Track on page unload
        window.addEventListener('beforeunload', () => {
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            gtag('event', 'page_exit', {
                event_category: 'engagement',
                time_on_page: totalTime,
                page_title: document.title
            });
        });
    },

    /**
     * Error tracking
     */
    trackErrors: function() {
        window.addEventListener('error', (error) => {
            gtag('event', 'javascript_error', {
                event_category: 'error',
                error_message: error.message || 'Unknown error',
                error_filename: error.filename || 'unknown',
                error_line: error.lineno || 0,
                error_column: error.colno || 0
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            gtag('event', 'promise_rejection', {
                event_category: 'error',
                error_message: event.reason || 'Unhandled promise rejection',
                error_type: 'promise_rejection'
            });
        });
    },

    /**
     * Inicialización automática
     */
    init: function() {
        // Solo inicializar si GA4 está habilitado
        if (typeof gtag !== 'undefined') {
            this.trackWebVitals();
            this.trackScrollDepth();
            this.trackTimeOnPage();
            this.trackErrors();
            
            console.log('📊 Toulouse GA4 Data Layer initialized');
        }
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ToulouseGA4DataLayer.init());
} else {
    ToulouseGA4DataLayer.init();
}

// Exportar para uso global
window.ToulouseGA4DataLayer = ToulouseGA4DataLayer;
```

### 📄 `extensions/analytics/facebook-pixel.js`

```javascript
/**
 * Facebook Pixel Integration - Eventos Educativos
 */
const ToulouseFacebookPixel = {
    pixelId: '', // Se configura desde config.js
    
    /**
     * Inicializar Facebook Pixel
     */
    init: function(pixelId) {
        if (!pixelId) return;
        
        this.pixelId = pixelId;
        
        // Cargar Facebook Pixel
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', pixelId);
        fbq('track', 'PageView');
    },

    /**
     * Lead generation tracking
     */
    trackLeadGeneration: function(formData) {
        if (!this.pixelId || typeof fbq === 'undefined') return;
        
        fbq('track', 'Lead', {
            content_name: formData.courseInterest || 'General Inquiry',
            content_category: 'Education',
            value: 100,
            currency: 'PEN',
            source: 'website'
        });
    },

    /**
     * Course interest tracking
     */
    trackCourseInterest: function(courseData) {
        if (!this.pixelId || typeof fbq === 'undefined') return;
        
        fbq('track', 'ViewContent', {
            content_type: 'course',
            content_name: courseData.title,
            content_category: courseData.category || 'Education',
            content_ids: [courseData.id || courseData.title],
            value: courseData.price || 0,
            currency: 'PEN'
        });
    },

    /**
     * Contact form submission
     */
    trackContactSubmission: function() {
        if (!this.pixelId || typeof fbq === 'undefined') return;
        
        fbq('track', 'Contact', {
            content_name: 'Contact Form',
            content_category: 'Lead Generation',
            source: 'contact_page'
        });
    },

    /**
     * Custom educational events
     */
    trackCustomEvent: function(eventName, eventData) {
        if (!this.pixelId || typeof fbq === 'undefined') return;
        
        fbq('trackCustom', eventName, eventData);
    }
};

// Exportar para uso global
window.ToulouseFacebookPixel = ToulouseFacebookPixel;
```

### 📄 `extensions/analytics/custom-events.js`

```javascript
/**
 * Custom Events - Eventos Personalizados para Toulouse Lautrec
 */
const ToulouseCustomEvents = {
    /**
     * Component visibility tracking
     */
    trackComponentVisibility: function() {
        const components = [
            '.hero-section',
            '.course-card',
            '.testimonials',
            '.feature-grid',
            '.contact-form'
        ];
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const componentName = this.getComponentName(entry.target);
                    
                    // GA4
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'component_view', {
                            event_category: 'component_engagement',
                            component_name: componentName,
                            component_position: this.getComponentPosition(entry.target),
                            visibility_percentage: Math.round(entry.intersectionRatio * 100)
                        });
                    }
                    
                    // Facebook Pixel
                    if (window.ToulouseFacebookPixel && window.ToulouseFacebookPixel.pixelId) {
                        window.ToulouseFacebookPixel.trackCustomEvent('ComponentView', {
                            component_name: componentName,
                            component_type: 'educational_content'
                        });
                    }
                }
            });
        }, { threshold: [0.1, 0.5, 0.9] });
        
        components.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                observer.observe(element);
            });
        });
    },

    /**
     * Form interaction tracking
     */
    trackFormInteractions: function() {
        document.querySelectorAll('form').forEach(form => {
            // Form start
            form.addEventListener('focusin', (e) => {
                const formName = form.id || form.className || 'unnamed_form';
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_start', {
                        event_category: 'form_interaction',
                        form_name: formName,
                        field_name: e.target.name || e.target.id || 'unnamed_field'
                    });
                }
            }, { once: true });

            // Form submission
            form.addEventListener('submit', (e) => {
                const formName = form.id || form.className || 'unnamed_form';
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        event_category: 'conversion',
                        form_name: formName,
                        form_location: window.location.pathname
                    });
                }
                
                // Facebook Pixel
                if (window.ToulouseFacebookPixel && window.ToulouseFacebookPixel.pixelId) {
                    if (formName.includes('contact')) {
                        window.ToulouseFacebookPixel.trackContactSubmission();
                    } else {
                        window.ToulouseFacebookPixel.trackLeadGeneration({
                            courseInterest: this.extractCourseInterest(form),
                            formType: formName
                        });
                    }
                }
            });
        });
    },

    /**
     * Navigation tracking
     */
    trackNavigation: function() {
        document.querySelectorAll('nav a, .menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                const linkText = link.textContent.trim();
                const linkUrl = link.href;
                const navSection = link.closest('nav')?.className || 'navigation';
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'navigation_click', {
                        event_category: 'navigation',
                        link_text: linkText,
                        link_url: linkUrl,
                        nav_section: navSection
                    });
                }
            });
        });
    },

    /**
     * Download tracking
     */
    trackDownloads: function() {
        document.querySelectorAll('a[href*=".pdf"], a[href*=".doc"], a[href*=".zip"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const fileName = link.href.split('/').pop();
                const fileType = fileName.split('.').pop().toLowerCase();
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'file_download', {
                        event_category: 'downloads',
                        file_name: fileName,
                        file_type: fileType,
                        download_location: window.location.pathname
                    });
                }
            });
        });
    },

    /**
     * Video interaction tracking
     */
    trackVideoInteractions: function() {
        document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').forEach(video => {
            if (video.tagName === 'VIDEO') {
                video.addEventListener('play', () => {
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'video_play', {
                            event_category: 'video_engagement',
                            video_title: video.title || 'unnamed_video',
                            video_duration: video.duration || 0
                        });
                    }
                });

                video.addEventListener('ended', () => {
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'video_complete', {
                            event_category: 'video_engagement',
                            video_title: video.title || 'unnamed_video',
                            video_duration: video.duration || 0
                        });
                    }
                });
            }
        });
    },

    /**
     * Search tracking (si hay búsqueda interna)
     */
    trackInternalSearch: function() {
        document.querySelectorAll('input[type="search"], .search-input').forEach(searchInput => {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const searchTerm = searchInput.value.trim();
                    
                    if (typeof gtag !== 'undefined' && searchTerm) {
                        gtag('event', 'search', {
                            search_term: searchTerm,
                            event_category: 'site_search'
                        });
                    }
                }
            });
        });
    },

    // Helper methods
    getComponentName: function(element) {
        if (element.classList.contains('hero-section')) return 'hero-section';
        if (element.classList.contains('course-card')) return 'course-card';
        if (element.classList.contains('testimonials')) return 'testimonials';
        if (element.classList.contains('feature-grid')) return 'feature-grid';
        if (element.classList.contains('contact-form')) return 'contact-form';
        return element.tagName.toLowerCase();
    },

    getComponentPosition: function(element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return Math.round(rect.top + scrollTop);
    },

    extractCourseInterest: function(form) {
        const courseSelect = form.querySelector('select[name*="curso"], select[name*="course"], select[name*="carrera"]');
        const courseInput = form.querySelector('input[name*="curso"], input[name*="course"], input[name*="carrera"]');
        
        if (courseSelect) return courseSelect.value;
        if (courseInput) return courseInput.value;
        
        return 'general_inquiry';
    },

    /**
     * Inicialización automática
     */
    init: function() {
        this.trackComponentVisibility();
        this.trackFormInteractions();
        this.trackNavigation();
        this.trackDownloads();
        this.trackVideoInteractions();
        this.trackInternalSearch();
        
        console.log('🎯 Toulouse Custom Events initialized');
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ToulouseCustomEvents.init());
} else {
    ToulouseCustomEvents.init();
}

// Exportar para uso global
window.ToulouseCustomEvents = ToulouseCustomEvents;
```

## 🔗 Integración en WordPress

### 📄 `functions.php` - Integration Hook

```php
<?php
// Cargar Analytics Manager por separado
function toulouse_design_system_load_analytics() {
    $analytics_file = get_template_directory() . '/inc/analytics-manager.php';
    if (file_exists($analytics_file)) {
        require_once $analytics_file;
    }
}
add_action('init', 'toulouse_design_system_load_analytics');

// Hook para insertar Analytics en wp_head
function toulouse_insert_analytics() {
    global $toulouse_analytics;
    
    if ($toulouse_analytics) {
        echo $toulouse_analytics->generateGA4Script();
        echo $toulouse_analytics->generateCustomEvents();
        echo $toulouse_analytics->loadAnalyticsExtensions();
    }
}
add_action('wp_head', 'toulouse_insert_analytics');

// Función helper para obtener config de Analytics
function toulouse_get_analytics_config() {
    // Esta función lee la configuración desde el archivo generado
    $config_file = get_template_directory() . '/assets/analytics-config.json';
    
    if (file_exists($config_file)) {
        $config_content = file_get_contents($config_file);
        return json_decode($config_content, true);
    }
    
    return array(
        'enabled' => false,
        'googleAnalytics' => array('enabled' => false)
    );
}
?>
```

## 🎯 Configuración sin Hardcoding

### ❌ Antes (Hardcoded)

```javascript
// ❌ Problemático - Lógica hardcodeada
if (componentName !== 'hero-section') {
    generateLazyLoadingScript(component);
}

if (componentName === 'course-card' || componentName === 'testimonials') {
    addAnalyticsTracking(component);
}
```

### ✅ Después (Metadata-driven)

```javascript
// ✅ Correcto - Configurado desde metadata
const componentMetadata = getComponentMetadata(componentName);

if (componentMetadata?.performance?.lazyLoading) {
    generateLazyLoadingScript(component);
}

if (componentMetadata?.analytics?.trackViews) {
    addAnalyticsTracking(component, componentMetadata.analytics);
}
```

## 🚨 Fail-Fast sin Fallbacks

### ❌ Antes (Con Fallbacks Silenciosos)

```javascript
// ❌ Oculta problemas
try {
    generateAnalyticsScript(config);
} catch (error) {
    console.warn('Analytics failed, continuing without tracking');
    return '<!-- Analytics disabled -->';
}
```

### ✅ Después (Fail-Fast)

```javascript
// ✅ Falla rápido con error claro
if (!config.analytics?.googleAnalytics?.measurementId) {
    throw new Error('❌ GA4 Measurement ID no configurado en config.js → analytics.googleAnalytics.measurementId');
}

if (!config.analytics?.enabled) {
    throw new Error('❌ Analytics deshabilitado en config.js → analytics.enabled debe ser true');
}

return generateAnalyticsScript(config);
```

## 📊 Ejemplo de Uso Completo

### 1️⃣ Configurar `config.js`

```javascript
export const config = {
  analytics: {
    enabled: true,
    googleAnalytics: {
      measurementId: 'G-ABC123DEF456', // ⚠️ Tu GA4 ID real
      enabled: true,
      enhancedEcommerce: true
    }
  }
};
```

### 2️⃣ Configurar Component Metadata

```json
{
  "course-card": {
    "type": "iterative",
    "performance": {
      "lazyLoading": true,
      "preloadImages": false
    },
    "analytics": {
      "trackViews": true,
      "trackClicks": true,
      "category": "course_engagement"
    }
  }
}
```

### 3️⃣ Generar WordPress Theme

```bash
npm run wp:generate
```

### 4️⃣ Resultado Final

El sistema genera automáticamente:

- ✅ **`inc/analytics-manager.php`** - Analytics Manager separado
- ✅ **`inc/seo-manager.php`** - SEO Manager puro 
- ✅ **Scripts GA4** configurados desde config.js
- ✅ **Extensiones** cargadas automáticamente
- ✅ **Event tracking** específico por componente
- ✅ **Performance tracking** (Web Vitals)
- ✅ **Error tracking** para debugging

## 🔍 Diferencias con SEO Manager

| Aspecto | Analytics Manager | SEO Manager |
|---------|-------------------|-------------|
| **Archivos** | `inc/analytics-manager.php` | `inc/seo-manager.php` |
| **Configuración** | `config.js` → `analytics` | `seo-config.json` |
| **Responsabilidad** | Tracking, eventos, medición | Meta tags, JSON-LD |
| **Output HTML** | `<script>` con GA4/FB | `<meta>` y `<script type="application/ld+json">` |
| **Extensiones** | `extensions/analytics/` | Templates SEO estáticos |
| **Dependencias** | gtag, fbq, custom events | Ninguna |
| **Configuración** | Desde JavaScript config | Desde JSON específico |

## 🎉 Beneficios de la Separación

### ✅ **Separation of Concerns**
- **Analytics**: Solo se encarga de tracking y medición
- **SEO**: Solo se encarga de meta tags y structured data

### ✅ **Mantenibilidad**
- Cambios en Analytics no afectan SEO
- Configuración independiente
- Testing aislado

### ✅ **Extensibilidad**
- Sistema de extensiones modulares
- Fácil agregar nuevas plataformas (GA4, Facebook, etc.)
- Configuración flexible

### ✅ **Performance**
- Carga condicional según configuración
- Sin código Analytics si está deshabilitado
- Lazy loading basado en metadata

## 🛠️ Comandos de Testing

```bash
# Generar tema con nueva arquitectura
npm run wp:generate

# Validar sintaxis PHP
npm run wp:validate-php

# Verificar estructura generada
ls -la wordpress-output/toulouse-lautrec/inc/
# Debe mostrar: analytics-manager.php y seo-manager.php por separado
```

---

**✨ Con esta separación, el sistema es más limpio, mantenible y sigue el principio de responsabilidad única. Cada manager se encarga de su dominio específico sin interferencias.**