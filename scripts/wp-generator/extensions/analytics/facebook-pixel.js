/**
 * Facebook Pixel Extension
 * 
 * Extensión para integrar Facebook Pixel con events mapping
 * y conversiones educativas.
 */
class FacebookPixelExtension {
  constructor(config) {
    this.config = config;
    this.pixelConfig = config.analytics?.facebookPixel || { enabled: false };
  }

  /**
   * Genera código base de Facebook Pixel
   */
  generatePixelScript() {
    if (!this.pixelConfig.enabled || !this.pixelConfig.pixelId) {
      return '';
    }

    return `
    <!-- Facebook Pixel -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      fbq('init', '${this.pixelConfig.pixelId}');
      fbq('track', 'PageView');
    </script>
    <noscript>
      <img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${this.pixelConfig.pixelId}&ev=PageView&noscript=1" />
    </noscript>`;
  }

  /**
   * Mapea eventos educativos a Facebook events
   */
  generateEducationalEvents(components, template) {
    if (!this.pixelConfig.enabled) {
      return '';
    }

    let events = '';

    // Eventos por template
    switch (template) {
      case 'page-carreras':
        events += `fbq('trackCustom', 'CarrerasPageView', {
          content_category: 'educational_content',
          content_type: 'careers_page'
        });`;
        break;
        
      case 'page-contacto':
        events += `fbq('trackCustom', 'ContactPageView', {
          content_category: 'lead_generation',
          content_type: 'contact_page'
        });`;
        break;
    }

    // Eventos por componentes
    components.forEach(component => {
      switch (component) {
        case 'course-card':
          events += `fbq('trackCustom', 'CourseView', {
            content_category: 'educational_content',
            content_type: 'course_card'
          });`;
          break;
          
        case 'testimonials':
          events += `fbq('trackCustom', 'TestimonialView', {
            content_category: 'social_proof', 
            content_type: 'testimonials'
          });`;
          break;
      }
    });

    return events ? `<script>${events}</script>` : '';
  }

  /**
   * Genera tracking de conversiones
   */
  generateConversionTracking() {
    return `
    // Facebook Pixel - Conversion Tracking
    document.querySelectorAll('form[action*="contact"], .cta-button, .course-signup').forEach(element => {
      element.addEventListener('click', function() {
        if (typeof fbq !== 'undefined') {
          fbq('track', 'Lead', {
            content_category: 'educational_lead',
            source: '${this.config.themeName || 'design_system'}_website'
          });
        }
      });
    });`;
  }
}

module.exports = FacebookPixelExtension;