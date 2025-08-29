/**
 * GA4 Data Layer Extension
 * 
 * Extensión avanzada para mapear datos complejos a GA4 data layer
 * con eventos de e-commerce, usuarios y contenido educativo.
 */
class GA4DataLayerExtension {
  constructor(config) {
    this.config = config;
  }

  /**
   * Genera data layer avanzado para GA4 Enhanced Ecommerce
   */
  generateEnhancedEcommerce(postType, postData) {
    if (postType === 'curso' || postType === 'carrera') {
      return {
        event: 'view_item',
        ecommerce: {
          currency: 'PEN',
          value: this.getCourseValue(postData),
          items: [{
            item_id: postData.id,
            item_name: postData.title,
            item_category: postType === 'curso' ? 'Curso' : 'Carrera',
            item_brand: 'Toulouse Lautrec',
            price: this.getCourseValue(postData)
          }]
        }
      };
    }
    
    return null;
  }

  /**
   * Genera eventos de engagement educativo
   */
  generateEducationalEvents(components) {
    const events = [];
    
    components.forEach(component => {
      switch (component) {
        case 'course-card':
          events.push({
            event: 'course_card_view',
            category: 'educational_content',
            action: 'view',
            label: 'course_discovery'
          });
          break;
          
        case 'testimonials':
          events.push({
            event: 'testimonial_view',
            category: 'social_proof',
            action: 'view', 
            label: 'student_testimonials'
          });
          break;
          
        case 'hero-section':
          events.push({
            event: 'hero_view',
            category: 'landing_engagement',
            action: 'view',
            label: 'main_hero'
          });
          break;
      }
    });
    
    return events;
  }

  /**
   * Genera tracking de interacciones avanzadas
   */
  generateInteractionTracking() {
    return `
    // Tracking de clics en CTAs
    document.querySelectorAll('[class*="cta"], [class*="button"]').forEach(button => {
      button.addEventListener('click', function(e) {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'cta_click', {
            event_category: 'engagement',
            event_label: this.textContent.trim(),
            button_location: this.closest('[class*="hero"], [class*="card"], [class*="section"]')?.className || 'unknown'
          });
        }
      });
    });
    
    // Tracking de scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
        maxScroll = scrollPercent;
        if (typeof gtag !== 'undefined') {
          gtag('event', 'scroll_depth', {
            event_category: 'engagement',
            value: scrollPercent,
            event_label: scrollPercent + '_percent'
          });
        }
      }
    });
    
    // Tracking de tiempo en página
    let startTime = Date.now();
    window.addEventListener('beforeunload', function() {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (typeof gtag !== 'undefined' && timeSpent > 10) {
        gtag('event', 'time_on_page', {
          event_category: 'engagement',
          value: timeSpent,
          event_label: timeSpent > 60 ? 'engaged' : 'quick_view'
        });
      }
    });`;
  }

  /**
   * Obtiene valor estimado del curso para e-commerce tracking
   */
  getCourseValue(postData) {
    // Lógica para determinar valor del curso
    // Podría venir de custom fields o configuración
    return postData.price || 500; // Valor por defecto
  }
}

module.exports = GA4DataLayerExtension;