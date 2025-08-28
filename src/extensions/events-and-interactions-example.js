/**
 * Extensión para manejo de eventos y interacciones de usuario
 * 
 * Esta extensión agrega funcionalidades para:
 * - Eventos de click, hover, scroll
 * - Validación de formularios
 * - Animaciones y transiciones
 * - Integración con analytics
 */

module.exports = function(config) {
  return {
    name: 'events-and-interactions',
    
    hooks: {
      afterComponentRender: async function(component, context, result) {
        // Agregar JavaScript para eventos según el tipo de componente
        let eventScript = '';
        
        switch (component.name) {
          case 'hero-section':
            eventScript = this.generateHeroEvents(component);
            break;
          case 'course-card':
            eventScript = this.generateCourseCardEvents(component);
            break;
          case 'testimonials':
            eventScript = this.generateTestimonialsEvents(component);
            break;
        }
        
        if (eventScript) {
          result += `<script>${eventScript}</script>`;
        }
        
        return result;
      }
    },

    // Métodos para generar eventos específicos
    generateHeroEvents: function(component) {
      return `
      // Eventos para hero-section
      document.addEventListener('DOMContentLoaded', function() {
        const heroCta = document.querySelector('.hero-cta');
        if (heroCta) {
          heroCta.addEventListener('click', function(e) {
            // Analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'click', {
                'event_category': 'engagement',
                'event_label': 'hero_cta_click'
              });
            }
            
            // Lógica adicional
            console.log('Hero CTA clicked');
          });
        }
      });
      `;
    },

    generateCourseCardEvents: function(component) {
      return `
      // Eventos para course-card
      document.addEventListener('DOMContentLoaded', function() {
        const courseCards = document.querySelectorAll('.course-card');
        courseCards.forEach(function(card) {
          // Hover effect
          card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
          });
          
          card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
          });
          
          // Click event
          card.addEventListener('click', function() {
            const link = this.querySelector('a');
            if (link) {
              // Analytics
              if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                  'event_category': 'engagement',
                  'event_label': 'course_card_click'
                });
              }
            }
          });
        });
      });
      `;
    },

    generateTestimonialsEvents: function(component) {
      return `
      // Eventos para testimonials
      document.addEventListener('DOMContentLoaded', function() {
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        let currentIndex = 0;
        
        // Auto-rotación de testimonios
        setInterval(function() {
          testimonialCards.forEach(function(card, index) {
            card.style.display = index === currentIndex ? 'block' : 'none';
          });
          
          currentIndex = (currentIndex + 1) % testimonialCards.length;
        }, 5000);
        
        // Eventos de rating
        const ratingStars = document.querySelectorAll('.star');
        ratingStars.forEach(function(star) {
          star.addEventListener('click', function() {
            const rating = this.parentElement.querySelectorAll('.star').length;
            console.log('Rating clicked:', rating);
            
            // Analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'click', {
                'event_category': 'engagement',
                'event_label': 'testimonial_rating'
              });
            }
          });
        });
      });
      `;
    }
  };
};