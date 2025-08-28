/**
 * Extensión de Interacciones Avanzadas
 * 
 * Esta extensión demuestra cómo agregar funcionalidades avanzadas como:
 * - Formularios con validación en tiempo real
 * - Filtros y búsqueda dinámica
 * - Animaciones y transiciones
 * - Integración con APIs externas
 * - Manejo de estado complejo
 */

module.exports = function(config) {
  return {
    name: 'advanced-interactions',
    
    hooks: {
      beforeComponentRender: async function(component, context) {
        // Preparar datos para componentes interactivos
        if (component.name === 'contact-form') {
          context.formValidation = this.generateFormValidationRules();
        }
        
        if (component.name === 'course-filter') {
          context.filterOptions = await this.generateFilterOptions();
        }
      },

      afterComponentRender: async function(component, context, result) {
        // Agregar funcionalidades interactivas según el componente
        let enhancedResult = result;
        
        switch (component.name) {
          case 'contact-form':
            enhancedResult += this.generateContactFormInteractions(context.formValidation);
            break;
            
          case 'course-filter':
            enhancedResult += this.generateFilterInteractions(context.filterOptions);
            break;
            
          case 'testimonials':
            enhancedResult += this.generateTestimonialsInteractions();
            break;
            
          case 'interactive-gallery':
            enhancedResult += this.generateGalleryInteractions();
            break;
        }
        
        return enhancedResult;
      }
    },

    // Generar reglas de validación para formularios
    generateFormValidationRules: function() {
      return {
        email: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Por favor ingresa un email válido'
        },
        phone: {
          pattern: /^[\+]?[0-9\s\-\(\)]{8,}$/,
          message: 'Por favor ingresa un teléfono válido'
        },
        required: {
          pattern: /^.+$/,
          message: 'Este campo es obligatorio'
        }
      };
    },

    // Generar opciones de filtro
    generateFilterOptions: async function() {
      return {
        categories: ['Diseño', 'Tecnología', 'Marketing', 'Arte'],
        levels: ['Básico', 'Intermedio', 'Avanzado'],
        durations: ['1-3 meses', '3-6 meses', '6+ meses'],
        prices: ['Gratis', 'Pago', 'Mixto']
      };
    },

    // Generar interacciones para formulario de contacto
    generateContactFormInteractions: function(validationRules) {
      return `
      <script>
      // Sistema de validación en tiempo real para formulario de contacto
      document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('.contact-form');
        if (!form) return;
        
        const validationRules = ${JSON.stringify(validationRules)};
        const fields = form.querySelectorAll('input, textarea, select');
        
        // Validación en tiempo real
        fields.forEach(field => {
          field.addEventListener('blur', function() {
            validateField(this, validationRules);
          });
          
          field.addEventListener('input', function() {
            clearFieldError(this);
          });
        });
        
        // Validación al enviar
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (validateForm(form, validationRules)) {
            submitForm(form);
          }
        });
        
        // Funciones de validación
        function validateField(field, rules) {
          const value = field.value.trim();
          const fieldType = field.type;
          const fieldName = field.name;
          
          // Limpiar errores previos
          clearFieldError(field);
          
          // Validar según tipo de campo
          let isValid = true;
          let errorMessage = '';
          
          if (field.hasAttribute('required') || field.classList.contains('required')) {
            if (!rules.required.pattern.test(value)) {
              isValid = false;
              errorMessage = rules.required.message;
            }
          }
          
          if (isValid && fieldType === 'email' && value) {
            if (!rules.email.pattern.test(value)) {
              isValid = false;
              errorMessage = rules.email.message;
            }
          }
          
          if (isValid && fieldName === 'phone' && value) {
            if (!rules.phone.pattern.test(value)) {
              isValid = false;
              errorMessage = rules.phone.message;
            }
          }
          
          if (!isValid) {
            showFieldError(field, errorMessage);
          }
          
          return isValid;
        }
        
        function validateForm(form, rules) {
          const fields = form.querySelectorAll('input, textarea, select');
          let isValid = true;
          
          fields.forEach(field => {
            if (!validateField(field, rules)) {
              isValid = false;
            }
          });
          
          return isValid;
        }
        
        function showFieldError(field, message) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'field-error';
          errorDiv.textContent = message;
          errorDiv.style.color = '#e74c3c';
          errorDiv.style.fontSize = '0.875rem';
          errorDiv.style.marginTop = '0.25rem';
          
          field.style.borderColor = '#e74c3c';
          field.parentNode.appendChild(errorDiv);
        }
        
        function clearFieldError(field) {
          const errorDiv = field.parentNode.querySelector('.field-error');
          if (errorDiv) {
            errorDiv.remove();
          }
          field.style.borderColor = '';
        }
        
        function submitForm(form) {
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          
          // Mostrar estado de carga
          submitBtn.textContent = 'Enviando...';
          submitBtn.disabled = true;
          
          // Simular envío (aquí iría la lógica real)
          setTimeout(() => {
            showSuccessMessage(form);
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }, 2000);
        }
        
        function showSuccessMessage(form) {
          const successDiv = document.createElement('div');
          successDiv.className = 'success-message';
          successDiv.innerHTML = '<strong>¡Mensaje enviado!</strong> Te contactaremos pronto.';
          successDiv.style.background = '#d4edda';
          successDiv.style.color = '#155724';
          successDiv.style.padding = '1rem';
          successDiv.style.borderRadius = '0.375rem';
          successDiv.style.marginTop = '1rem';
          
          form.appendChild(successDiv);
          
          setTimeout(() => {
            successDiv.remove();
          }, 5000);
        }
      });
      </script>`;
    },

    // Generar interacciones para filtros
    generateFilterInteractions: function(filterOptions) {
      return `
      <script>
      // Sistema de filtros dinámicos para cursos
      document.addEventListener('DOMContentLoaded', function() {
        const filterContainer = document.querySelector('.course-filter');
        if (!filterContainer) return;
        
        const filterOptions = ${JSON.stringify(filterOptions)};
        const courseCards = document.querySelectorAll('.course-card');
        
        // Crear controles de filtro
        createFilterControls(filterContainer, filterOptions);
        
        // Aplicar filtros
        function applyFilters() {
          const activeFilters = getActiveFilters();
          
          courseCards.forEach(card => {
            const cardData = getCardData(card);
            const isVisible = matchesFilters(cardData, activeFilters);
            
            card.style.display = isVisible ? 'block' : 'none';
            
            if (isVisible) {
              card.style.animation = 'fadeIn 0.3s ease-in';
            }
          });
          
          updateResultsCount();
        }
        
        function createFilterControls(container, options) {
          const filterControls = document.createElement('div');
          filterControls.className = 'filter-controls';
          filterControls.style.marginBottom = '2rem';
          
          Object.keys(options).forEach(filterType => {
            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group';
            filterGroup.style.marginBottom = '1rem';
            
            const label = document.createElement('label');
            label.textContent = filterType.charAt(0).toUpperCase() + filterType.slice(1);
            label.style.fontWeight = 'bold';
            label.style.marginBottom = '0.5rem';
            label.style.display = 'block';
            
            const select = document.createElement('select');
            select.className = \`filter-select filter-\${filterType}\`;
            select.style.padding = '0.5rem';
            select.style.borderRadius = '0.375rem';
            select.style.border = '1px solid #d1d5db';
            
            // Opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = \`Todos los \${filterType}\`;
            select.appendChild(defaultOption);
            
            // Opciones específicas
            options[filterType].forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option;
              optionElement.textContent = option;
              select.appendChild(optionElement);
            });
            
            select.addEventListener('change', applyFilters);
            
            filterGroup.appendChild(label);
            filterGroup.appendChild(select);
            filterControls.appendChild(filterGroup);
          });
          
          container.insertBefore(filterControls, container.firstChild);
        }
        
        function getActiveFilters() {
          const filters = {};
          const selects = document.querySelectorAll('.filter-select');
          
          selects.forEach(select => {
            if (select.value) {
              const filterType = select.className.split(' ')[1].replace('filter-', '');
              filters[filterType] = select.value;
            }
          });
          
          return filters;
        }
        
        function getCardData(card) {
          return {
            category: card.dataset.category || '',
            level: card.dataset.level || '',
            duration: card.dataset.duration || '',
            price: card.dataset.price || ''
          };
        }
        
        function matchesFilters(cardData, filters) {
          return Object.keys(filters).every(filterType => {
            return !filters[filterType] || cardData[filterType] === filters[filterType];
          });
        }
        
        function updateResultsCount() {
          const visibleCards = document.querySelectorAll('.course-card[style*="display: block"], .course-card:not([style*="display: none"])');
          const countElement = document.querySelector('.results-count');
          
          if (countElement) {
            countElement.textContent = \`\${visibleCards.length} cursos encontrados\`;
          }
        }
        
        // Animación CSS
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        \`;
        document.head.appendChild(style);
      });
      </script>`;
    },

    // Generar interacciones para testimonios
    generateTestimonialsInteractions: function() {
      return `
      <script>
      // Sistema de testimonios interactivos
      document.addEventListener('DOMContentLoaded', function() {
        const testimonialsContainer = document.querySelector('.testimonials-grid');
        if (!testimonialsContainer) return;
        
        const testimonialCards = testimonialsContainer.querySelectorAll('.testimonial-card');
        let currentIndex = 0;
        let autoPlayInterval;
        
        // Auto-rotación
        function startAutoPlay() {
          autoPlayInterval = setInterval(() => {
            showTestimonial((currentIndex + 1) % testimonialCards.length);
          }, 5000);
        }
        
        function stopAutoPlay() {
          if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
          }
        }
        
        function showTestimonial(index) {
          testimonialCards.forEach((card, i) => {
            card.style.display = i === index ? 'block' : 'none';
            card.style.animation = i === index ? 'slideIn 0.5s ease-out' : '';
          });
          
          currentIndex = index;
          updateIndicators();
        }
        
        function updateIndicators() {
          const indicators = document.querySelectorAll('.testimonial-indicator');
          indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === currentIndex);
          });
        }
        
        // Crear indicadores
        function createIndicators() {
          const indicatorsContainer = document.createElement('div');
          indicatorsContainer.className = 'testimonial-indicators';
          indicatorsContainer.style.textAlign = 'center';
          indicatorsContainer.style.marginTop = '1rem';
          
          testimonialCards.forEach((_, i) => {
            const indicator = document.createElement('button');
            indicator.className = 'testimonial-indicator';
            indicator.style.width = '12px';
            indicator.style.height = '12px';
            indicator.style.borderRadius = '50%';
            indicator.style.border = 'none';
            indicator.style.margin = '0 4px';
            indicator.style.cursor = 'pointer';
            indicator.style.background = i === 0 ? '#3498db' : '#ddd';
            
            indicator.addEventListener('click', () => {
              showTestimonial(i);
              stopAutoPlay();
              startAutoPlay();
            });
            
            indicatorsContainer.appendChild(indicator);
          });
          
          testimonialsContainer.appendChild(indicatorsContainer);
        }
        
        // Controles de navegación
        function createNavigationControls() {
          const controlsContainer = document.createElement('div');
          controlsContainer.className = 'testimonial-controls';
          controlsContainer.style.textAlign = 'center';
          controlsContainer.style.marginTop = '1rem';
          
          const prevBtn = document.createElement('button');
          prevBtn.textContent = '← Anterior';
          prevBtn.className = 'testimonial-nav-btn';
          prevBtn.style.marginRight = '1rem';
          prevBtn.style.padding = '0.5rem 1rem';
          prevBtn.style.border = '1px solid #3498db';
          prevBtn.style.background = 'white';
          prevBtn.style.color = '#3498db';
          prevBtn.style.borderRadius = '0.375rem';
          prevBtn.style.cursor = 'pointer';
          
          const nextBtn = document.createElement('button');
          nextBtn.textContent = 'Siguiente →';
          nextBtn.className = 'testimonial-nav-btn';
          nextBtn.style.padding = '0.5rem 1rem';
          nextBtn.style.border = '1px solid #3498db';
          nextBtn.style.background = '#3498db';
          nextBtn.style.color = 'white';
          nextBtn.style.borderRadius = '0.375rem';
          nextBtn.style.cursor = 'pointer';
          
          prevBtn.addEventListener('click', () => {
            const newIndex = currentIndex === 0 ? testimonialCards.length - 1 : currentIndex - 1;
            showTestimonial(newIndex);
            stopAutoPlay();
            startAutoPlay();
          });
          
          nextBtn.addEventListener('click', () => {
            const newIndex = (currentIndex + 1) % testimonialCards.length;
            showTestimonial(newIndex);
            stopAutoPlay();
            startAutoPlay();
          });
          
          controlsContainer.appendChild(prevBtn);
          controlsContainer.appendChild(nextBtn);
          testimonialsContainer.appendChild(controlsContainer);
        }
        
        // Inicializar
        if (testimonialCards.length > 1) {
          createIndicators();
          createNavigationControls();
          startAutoPlay();
          
          // Pausar en hover
          testimonialsContainer.addEventListener('mouseenter', stopAutoPlay);
          testimonialsContainer.addEventListener('mouseleave', startAutoPlay);
        }
        
        // Animación CSS
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          .testimonial-indicator.active {
            background: #3498db !important;
          }
        \`;
        document.head.appendChild(style);
      });
      </script>`;
    },

    // Generar interacciones para galería
    generateGalleryInteractions: function() {
      return `
      <script>
      // Sistema de galería interactiva avanzada
      document.addEventListener('DOMContentLoaded', function() {
        const gallery = document.querySelector('.interactive-gallery');
        if (!gallery) return;
        
        const images = gallery.querySelectorAll('.gallery-image');
        const thumbnails = gallery.querySelectorAll('.thumbnail');
        const controls = gallery.querySelectorAll('.gallery-btn');
        
        let currentIndex = 0;
        let isFullscreen = false;
        
        // Navegación con teclado
        document.addEventListener('keydown', function(e) {
          if (!gallery.contains(document.activeElement)) return;
          
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              previousImage();
              break;
            case 'ArrowRight':
              e.preventDefault();
              nextImage();
              break;
            case 'Escape':
              e.preventDefault();
              exitFullscreen();
              break;
            case 'f':
            case 'F':
              e.preventDefault();
              toggleFullscreen();
              break;
          }
        });
        
        // Navegación con gestos táctiles
        let touchStartX = 0;
        let touchEndX = 0;
        
        gallery.addEventListener('touchstart', function(e) {
          touchStartX = e.changedTouches[0].screenX;
        });
        
        gallery.addEventListener('touchend', function(e) {
          touchEndX = e.changedTouches[0].screenX;
          handleSwipe();
        });
        
        function handleSwipe() {
          const swipeThreshold = 50;
          const diff = touchStartX - touchEndX;
          
          if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
              nextImage();
            } else {
              previousImage();
            }
          }
        }
        
        // Funciones de navegación
        function nextImage() {
          currentIndex = (currentIndex + 1) % images.length;
          updateGallery();
        }
        
        function previousImage() {
          currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
          updateGallery();
        }
        
        function goToImage(index) {
          currentIndex = index;
          updateGallery();
        }
        
        function updateGallery() {
          // Actualizar imagen principal
          images.forEach((img, i) => {
            img.style.display = i === currentIndex ? 'block' : 'none';
            img.style.animation = i === currentIndex ? 'fadeInScale 0.3s ease-out' : '';
          });
          
          // Actualizar thumbnails
          thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentIndex);
          });
          
          // Actualizar controles
          controls.forEach(control => {
            if (control.textContent.includes('Anterior')) {
              control.disabled = currentIndex === 0;
            } else if (control.textContent.includes('Siguiente')) {
              control.disabled = currentIndex === images.length - 1;
            }
          });
          
          // Actualizar contador
          const counter = gallery.querySelector('.gallery-counter');
          if (counter) {
            counter.textContent = \`\${currentIndex + 1} de \${images.length}\`;
          }
        }
        
        // Funciones de fullscreen
        function toggleFullscreen() {
          if (!isFullscreen) {
            enterFullscreen();
          } else {
            exitFullscreen();
          }
        }
        
        function enterFullscreen() {
          if (gallery.requestFullscreen) {
            gallery.requestFullscreen();
          } else if (gallery.webkitRequestFullscreen) {
            gallery.webkitRequestFullscreen();
          } else if (gallery.msRequestFullscreen) {
            gallery.msRequestFullscreen();
          }
          
          isFullscreen = true;
          gallery.classList.add('fullscreen');
        }
        
        function exitFullscreen() {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
          
          isFullscreen = false;
          gallery.classList.remove('fullscreen');
        }
        
        // Event listeners
        document.addEventListener('fullscreenchange', function() {
          isFullscreen = !!document.fullscreenElement;
          gallery.classList.toggle('fullscreen', isFullscreen);
        });
        
        // Zoom en imagen
        images.forEach(img => {
          img.addEventListener('click', function() {
            if (!isFullscreen) {
              toggleFullscreen();
            }
          });
        });
        
        // Animaciones CSS
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          
          .interactive-gallery.fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .interactive-gallery.fullscreen .gallery-image {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
          }
        \`;
        document.head.appendChild(style);
      });
      </script>`;
    },

    // Hooks personalizados
    customHooks: {
      'validateFormField': async function(fieldName, value, rules) {
        // Hook para validación personalizada de campos
        return {
          isValid: true,
          message: ''
        };
      },
      
      'handleFormSubmission': async function(formData) {
        // Hook para manejo personalizado de envío de formularios
        console.log('Formulario enviado:', formData);
        return { success: true };
      },
      
      'filterData': async function(data, filters) {
        // Hook para filtrado personalizado de datos
        return data.filter(item => {
          return Object.keys(filters).every(key => {
            return !filters[key] || item[key] === filters[key];
          });
        });
      }
    }
  };
};
