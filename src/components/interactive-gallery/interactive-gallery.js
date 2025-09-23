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

  static styles = css``;

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
