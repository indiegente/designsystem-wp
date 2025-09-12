/**
 * Custom Events Extension
 * 
 * Extensión para eventos personalizados específicos del contexto educativo
 * con mapeo avanzado de interacciones y métricas de engagement.
 */
class CustomEventsExtension {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadComponentMetadata();
  }

  /**
   * Carga metadata de componentes
   */
  loadComponentMetadata() {
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return {};
  }

  /**
   * Genera eventos educativos específicos
   */
  generateEducationalInteractions() {
    return `
    // Custom Events - Educational Interactions
    
    // Tracking de interacción con testimonios
    document.querySelectorAll('.testimonial-card').forEach((card, index) => {
      card.addEventListener('click', function() {
        const authorName = this.querySelector('.author-name')?.textContent || 'unknown';
        const rating = this.querySelectorAll('.star[content="★"]').length || 0;
        
        // Multiple analytics platforms
        if (typeof gtag !== 'undefined') {
          gtag('event', 'testimonial_interaction', {
            event_category: 'social_proof',
            author: authorName,
            rating: rating,
            position: index + 1
          });
        }
        
        if (typeof fbq !== 'undefined') {
          fbq('trackCustom', 'TestimonialInteraction', {
            author: authorName,
            rating: rating
          });
        }
        
        console.log('Custom Event: Testimonial clicked', { author: authorName, rating });
      });
    });
    
    // Tracking de exploración de carreras
    document.querySelectorAll('.course-card, [class*="course"]').forEach((card, index) => {
      card.addEventListener('mouseenter', function() {
        const courseTitle = this.querySelector('.course-title, h3, h2')?.textContent || 'unknown';
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'course_exploration', {
            event_category: 'educational_engagement',
            course_name: courseTitle,
            interaction_type: 'hover',
            position: index + 1
          });
        }
      });
      
      card.addEventListener('click', function() {
        const courseTitle = this.querySelector('.course-title, h3, h2')?.textContent || 'unknown';
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'course_click', {
            event_category: 'educational_engagement', 
            course_name: courseTitle,
            interaction_type: 'click',
            position: index + 1
          });
        }
        
        if (typeof fbq !== 'undefined') {
          fbq('trackCustom', 'CourseInterest', {
            course_name: courseTitle
          });
        }
      });
    });
    
    // Tracking de navegación en galería interactiva
    document.querySelectorAll('.gallery-btn, .thumbnail').forEach(button => {
      button.addEventListener('click', function() {
        const gallerySection = this.closest('.gallery-section, [class*="gallery"]');
        const galleryTitle = gallerySection?.querySelector('h2, h3')?.textContent || 'gallery';
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'gallery_interaction', {
            event_category: 'content_engagement',
            gallery_name: galleryTitle,
            interaction_type: this.classList.contains('thumbnail') ? 'thumbnail_click' : 'navigation'
          });
        }
      });
    });
    
    // Tracking de errores JavaScript
    window.addEventListener('error', function(e) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'javascript_error', {
          event_category: 'technical',
          error_message: e.message,
          error_filename: e.filename,
          error_line: e.lineno
        });
      }
      
      console.log('Custom Event: JavaScript error tracked', e.message);
    });
    
    // Tracking de performance (LCP, FID, CLS)
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'performance',
            metric_name: 'LCP',
            value: Math.round(lastEntry.startTime),
            event_label: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor'
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay  
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'performance',
              metric_name: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              event_label: entry.processingStart - entry.startTime < 100 ? 'good' : 'needs_improvement'
            });
          }
        });
      }).observe({ entryTypes: ['first-input'] });
    }`;
  }

  /**
   * Genera data layer para remarketing educativo
   */
  generateRemarketingData(postType, postData) {
    const remarketingData = {
      event: 'page_view',
      page_type: postType,
      educational_category: this.getEducationalCategory(postType),
      user_journey_stage: this.getUserJourneyStage(),
      content_group1: 'Educational Content',
      content_group2: postType === 'carrera' ? 'Career Programs' : 'Course Catalog'
    };

    if (postData) {
      remarketingData.content_id = postData.id;
      remarketingData.content_name = postData.title;
    }

    return remarketingData;
  }

  /**
   * Determina categoría educativa del contenido
   */
  getEducationalCategory(postType) {
    const categories = {
      'carrera': 'career_programs',
      'curso': 'courses', 
      'testimonio': 'social_proof',
      'producto': 'educational_products'
    };
    
    return categories[postType] || 'general_content';
  }

  /**
   * Determina etapa del journey del usuario
   */
  getUserJourneyStage() {
    // Lógica para determinar etapa basada en páginas visitadas
    // Esto podría integrarse con cookies o localStorage
    const currentUrl = window.location.pathname;
    
    if (currentUrl.includes('/carreras')) return 'discovery';
    if (currentUrl.includes('/contacto')) return 'consideration';
    if (currentUrl.includes('/curso/') || currentUrl.includes('/carrera/')) return 'evaluation';
    
    return 'awareness';
  }
}

module.exports = CustomEventsExtension;