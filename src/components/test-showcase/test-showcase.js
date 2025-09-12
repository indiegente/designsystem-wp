import { LitElement, html, css } from 'lit';

/**
 * Componente de prueba completo para validar todos los managers
 * Incluye: imágenes lazy, eventos analytics, SEO schema, interacciones
 */
export class TestShowcase extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      description: { type: String },
      testImages: { type: Array }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: var(--tl-spacing-12);
        background: var(--tl-neutral-50);
      }

      .test-showcase {
        max-width: 1200px;
        margin: 0 auto;
      }

      .test-header {
        text-align: center;
        margin-bottom: var(--tl-spacing-8);
      }

      .test-title {
        font-size: var(--tl-font-size-3xl);
        font-weight: var(--tl-font-weight-bold);
        color: var(--tl-neutral-900);
        margin-bottom: var(--tl-spacing-4);
      }

      .test-description {
        font-size: var(--tl-font-size-lg);
        color: var(--tl-neutral-600);
        margin-bottom: var(--tl-spacing-8);
      }

      .test-sections {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--tl-spacing-8);
      }

      .test-section {
        background: white;
        border-radius: 12px;
        padding: var(--tl-spacing-6);
        box-shadow: var(--tl-shadow-md);
      }

      .section-title {
        font-size: var(--tl-font-size-xl);
        font-weight: var(--tl-font-weight-semibold);
        color: var(--tl-primary-600);
        margin-bottom: var(--tl-spacing-4);
        border-bottom: 2px solid var(--tl-primary-100);
        padding-bottom: var(--tl-spacing-2);
      }

      .test-images {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--tl-spacing-4);
        margin-bottom: var(--tl-spacing-6);
      }

      .test-image {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 8px;
        transition: var(--tl-transition-normal);
        cursor: pointer;
      }

      .test-image:hover {
        transform: scale(1.05);
        box-shadow: var(--tl-shadow-lg);
      }

      .test-buttons {
        display: flex;
        gap: var(--tl-spacing-4);
        flex-wrap: wrap;
        margin-bottom: var(--tl-spacing-6);
      }

      .test-button {
        background: var(--tl-primary-500);
        color: white;
        border: none;
        padding: var(--tl-spacing-3) var(--tl-spacing-6);
        border-radius: 8px;
        cursor: pointer;
        font-weight: var(--tl-font-weight-medium);
        transition: var(--tl-transition-normal);
      }

      .test-button:hover {
        background: var(--tl-primary-600);
        transform: translateY(-2px);
      }

      .test-button.secondary {
        background: var(--tl-accent-500);
      }

      .test-button.secondary:hover {
        background: var(--tl-accent-600);
      }

      .test-form {
        display: grid;
        gap: var(--tl-spacing-4);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--tl-spacing-2);
      }

      .form-label {
        font-weight: var(--tl-font-weight-medium);
        color: var(--tl-neutral-700);
      }

      .form-input, .form-textarea {
        padding: var(--tl-spacing-3);
        border: 1px solid var(--tl-neutral-300);
        border-radius: 6px;
        font-family: inherit;
      }

      .form-input:focus, .form-textarea:focus {
        outline: none;
        border-color: var(--tl-primary-500);
        box-shadow: 0 0 0 3px var(--tl-primary-100);
      }

      .analytics-events {
        background: var(--tl-neutral-100);
        padding: var(--tl-spacing-4);
        border-radius: 8px;
        font-family: monospace;
        font-size: var(--tl-font-size-sm);
      }

      @media (max-width: 768px) {
        .test-sections {
          grid-template-columns: 1fr;
        }
        
        .test-images {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
      }
    `;
  }

  constructor() {
    super();
    this.title = 'Test Showcase - Validación Completa';
    this.description = 'Componente para probar todos los managers';
    this.testImages = [
      { src: 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Test+1', alt: 'Test 1' },
      { src: 'https://via.placeholder.com/300x200/F7931E/FFFFFF?text=Test+2', alt: 'Test 2' }
    ];
  }
no
  firstUpdated() {
    this.setupAnalyticsEvents();
    this.logComponentLoad();
  }

  setupAnalyticsEvents() {
    // Eventos para testing de Analytics Manager
    const buttons = this.shadowRoot.querySelectorAll('.test-button');
    const images = this.shadowRoot.querySelectorAll('.test-image');
    const form = this.shadowRoot.querySelector('.test-form');

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        this.trackEvent('button_click', {
          button_type: button.classList.contains('secondary') ? 'secondary' : 'primary',
          button_index: index,
          component: 'test-showcase'
        });
      });
    });

    images.forEach((image, index) => {
      image.addEventListener('click', () => {
        this.trackEvent('image_interaction', {
          image_index: index,
          image_src: image.src,
          component: 'test-showcase'
        });
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.trackEvent('form_submit', {
          form_type: 'test_form',
          component: 'test-showcase'
        });
      });
    }
  }

  trackEvent(eventName, eventData) {
    // Tracking para Analytics Manager
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'test_showcase',
        custom_parameter: 'toulouse_design_system',
        ...eventData
      });
    }

    // Console log para debug
    console.log('Test Showcase Event:', { event: eventName, data: eventData });

    // Dispatchar evento personalizado
    this.dispatchEvent(new CustomEvent('test-analytics-event', {
      detail: { event: eventName, data: eventData },
      bubbles: true
    }));
  }

  logComponentLoad() {
    this.trackEvent('component_view', {
      component: 'test-showcase',
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  render() {
    return html`
      <div class="test-showcase">
        <div class="test-header">
          <h2 class="test-title">${this.title}</h2>
          <p class="test-description">${this.description}</p>
        </div>

        <div class="test-sections">
          <div class="test-section">
            <h3 class="section-title">Asset Manager Test</h3>
            <p>Imágenes con lazy loading para validar Asset Manager:</p>
            
            <div class="test-images">
              ${this.testImages.map((img, index) => html`
                <img 
                  class="test-image"
                  src="${img.src}" 
                  alt="${img.alt}"
                  loading="lazy"
                />
              `)}
            </div>
            
            <div class="test-buttons">
              <button class="test-button">CTA Test</button>
              <button class="test-button secondary">Secondary CTA</button>
            </div>
          </div>

          <div class="test-section">
            <h3 class="section-title">Analytics Manager Test</h3>
            <p>Eventos de GA4 y tracking personalizado:</p>
            
            <div class="analytics-info">
              <p>Eventos: page_view, component_view, interactions</p>
            </div>
          </div>

          <div class="test-section">
            <h3 class="section-title">SEO Manager Test</h3>
            <p>Meta tags, OpenGraph y Schema.org:</p>
            
            <div class="seo-info">
              <p>Features: meta description, OpenGraph, JSON-LD, canonical</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    this.trackEvent('form_submit', {
      form_type: 'test_form',
      fields: Object.keys(data),
      component: 'test-showcase'
    });
    
    // Mostrar feedback visual
    e.target.querySelector('.test-button[type="submit"]').textContent = '✅ Enviado!';
    setTimeout(() => {
      e.target.querySelector('.test-button[type="submit"]').textContent = 'Enviar Test Form';
    }, 2000);
  }
}

customElements.define('test-showcase', TestShowcase);