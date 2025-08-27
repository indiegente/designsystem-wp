import { LitElement, html, css } from 'lit';

export class HeroSection extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    ctaText: { type: String },
    backgroundImage: { type: String }
  };

  static styles = css`
    :host {
      display: block;
    }
    .hero {
      min-height: 60vh;
      background: linear-gradient(135deg, var(--tl-primary-500) 0%, var(--tl-accent-500) 100%);
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: 2;
    }
    .hero-content {
      position: relative;
      z-index: 3;
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--tl-spacing-8);
      color: white;
    }
    .hero-title {
      font-size: var(--tl-font-size-3xl);
      font-weight: var(--tl-font-weight-semibold);
      margin-bottom: var(--tl-spacing-4);
      line-height: 1.2;
    }
    .hero-subtitle {
      font-size: var(--tl-font-size-lg);
      margin-bottom: var(--tl-spacing-6);
      opacity: 0.9;
    }
    .hero-cta {
      background: var(--tl-accent-500);
      color: white;
      padding: var(--tl-spacing-4) var(--tl-spacing-6);
      border-radius: 8px;
      text-decoration: none;
      font-weight: var(--tl-font-weight-semibold);
      transition: var(--tl-transition-normal);
      display: inline-block;
    }
    .hero-cta:hover {
      transform: translateY(-2px);
      box-shadow: var(--tl-shadow-lg);
    }
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }
      .hero-content {
        padding: var(--tl-spacing-4);
      }
    }
  `;

  render() {
    return html`
      <section class="hero">
        ${this.backgroundImage ? html`
          <img class="hero-bg" src="${this.backgroundImage}" alt="" loading="eager" />
        ` : ''}
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title">${this.title}</h1>
          <p class="hero-subtitle">${this.subtitle}</p>
          <a href="#cursos" class="hero-cta">${this.ctaText}</a>
        </div>
      </section>
    `;
  }
}

customElements.define('tl-hero-section', HeroSection);
