import { LitElement, html, css, unsafeCSS } from 'lit';
import './hero-section.css'; // For global Storybook/WordPress styles
import componentStyles from './hero-section.css?inline'; // For Shadow DOM

export class HeroSection extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    ctaText: { type: String },
    backgroundImage: { type: String }
  };

  // 🏆 MEJOR PRÁCTICA: Vite ?inline es el estándar moderno
  static styles = css`${unsafeCSS(componentStyles)}`;

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
