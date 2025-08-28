import { LitElement, html, css } from 'lit';

export class InteractiveGallery extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    images: { type: Array },
    autoPlay: { type: Boolean },
    showThumbnails: { type: Boolean },
    currentIndex: { type: Number }
  };

  constructor() {
    super();
    this.title = 'Galería Interactiva';
    this.subtitle = 'Explora nuestras imágenes';
    this.images = [];
    this.autoPlay = true;
    this.showThumbnails = true;
    this.currentIndex = 0;
  }

  static styles = css`
    :host {
      display: block;
    }

    .gallery-section {
      padding: var(--tl-spacing-12) 0;
      background: var(--tl-neutral-50);
    }

    .gallery-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--tl-spacing-6);
    }

    .gallery-header {
      text-align: center;
      margin-bottom: var(--tl-spacing-8);
    }

    .gallery-title {
      font-size: var(--tl-font-size-3xl);
      font-weight: var(--tl-font-weight-bold);
      color: var(--tl-neutral-900);
      margin-bottom: var(--tl-spacing-4);
    }

    .gallery-subtitle {
      font-size: var(--tl-font-size-lg);
      color: var(--tl-neutral-600);
    }

    .gallery-main {
      position: relative;
      margin-bottom: var(--tl-spacing-6);
    }

    .gallery-image {
      width: 100%;
      height: 400px;
      object-fit: cover;
      border-radius: 12px;
      transition: var(--tl-transition-normal);
    }

    .gallery-controls {
      display: flex;
      justify-content: center;
      gap: var(--tl-spacing-4);
      margin-bottom: var(--tl-spacing-6);
    }

    .gallery-btn {
      background: var(--tl-primary-500);
      color: white;
      border: none;
      padding: var(--tl-spacing-3) var(--tl-spacing-6);
      border-radius: 8px;
      cursor: pointer;
      font-weight: var(--tl-font-weight-medium);
      transition: var(--tl-transition-normal);
    }

    .gallery-btn:hover {
      background: var(--tl-primary-600);
      transform: translateY(-2px);
    }

    .gallery-btn:disabled {
      background: var(--tl-neutral-400);
      cursor: not-allowed;
      transform: none;
    }

    .gallery-thumbnails {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: var(--tl-spacing-4);
      max-width: 600px;
      margin: 0 auto;
    }

    .thumbnail {
      width: 100%;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--tl-transition-normal);
      border: 3px solid transparent;
    }

    .thumbnail:hover {
      transform: scale(1.05);
    }

    .thumbnail.active {
      border-color: var(--tl-primary-500);
    }

    .gallery-counter {
      text-align: center;
      font-size: var(--tl-font-size-sm);
      color: var(--tl-neutral-600);
      margin-top: var(--tl-spacing-4);
    }

    .gallery-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
      background: var(--tl-neutral-100);
      border-radius: 12px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--tl-neutral-200);
      border-top: 4px solid var(--tl-primary-500);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .gallery-thumbnails {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      }
      
      .gallery-image {
        height: 300px;
      }
    }
  `;

  render() {
    if (!this.images || this.images.length === 0) {
      return html`
        <section class="gallery-section">
          <div class="gallery-container">
            <div class="gallery-header">
              <h2 class="gallery-title">${this.title}</h2>
              <p class="gallery-subtitle">${this.subtitle}</p>
            </div>
            <div class="gallery-loading">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </section>
      `;
    }

    const currentImage = this.images[this.currentIndex];

    return html`
      <section class="gallery-section">
        <div class="gallery-container">
          <div class="gallery-header">
            <h2 class="gallery-title">${this.title}</h2>
            <p class="gallery-subtitle">${this.subtitle}</p>
          </div>

          <div class="gallery-main">
            <img 
              src="${currentImage.url}" 
              alt="${currentImage.alt || currentImage.title}"
              class="gallery-image"
              @click=${this.openLightbox}
            />
          </div>

          <div class="gallery-controls">
            <button 
              class="gallery-btn" 
              @click=${this.previousImage}
              ?disabled=${this.currentIndex === 0}
            >
              ← Anterior
            </button>
            
            <button 
              class="gallery-btn" 
              @click=${this.toggleAutoPlay}
            >
              ${this.autoPlay ? '⏸️ Pausar' : '▶️ Reproducir'}
            </button>
            
            <button 
              class="gallery-btn" 
              @click=${this.nextImage}
              ?disabled=${this.currentIndex === this.images.length - 1}
            >
              Siguiente →
            </button>
          </div>

          ${this.showThumbnails ? html`
            <div class="gallery-thumbnails">
              ${this.images.map((image, index) => html`
                <img 
                  src="${image.url}" 
                  alt="${image.alt || image.title}"
                  class="thumbnail ${index === this.currentIndex ? 'active' : ''}"
                  @click=${() => this.goToImage(index)}
                />
              `)}
            </div>
          ` : ''}

          <div class="gallery-counter">
            ${this.currentIndex + 1} de ${this.images.length}
          </div>
        </div>
      </section>
    `;
  }

  // Métodos para interactividad
  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.dispatchEvent(new CustomEvent('image-changed', {
        detail: { index: this.currentIndex, image: this.images[this.currentIndex] }
      }));
    }
  }

  previousImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.dispatchEvent(new CustomEvent('image-changed', {
        detail: { index: this.currentIndex, image: this.images[this.currentIndex] }
      }));
    }
  }

  goToImage(index) {
    this.currentIndex = index;
    this.dispatchEvent(new CustomEvent('image-changed', {
      detail: { index: this.currentIndex, image: this.images[this.currentIndex] }
    }));
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    this.dispatchEvent(new CustomEvent('autoplay-toggled', {
      detail: { autoPlay: this.autoPlay }
    }));
  }

  openLightbox() {
    this.dispatchEvent(new CustomEvent('lightbox-open', {
      detail: { image: this.images[this.currentIndex], index: this.currentIndex }
    }));
  }

  // Lifecycle methods
  firstUpdated() {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      if (this.autoPlay) {
        this.nextImage();
      }
    }, 3000);
  }

  disconnectedCallback() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }
}

customElements.define('tl-interactive-gallery', InteractiveGallery);
