import { LitElement, html, css, unsafeCSS } from 'lit';
import './testimonials.css'; // For global Storybook/WordPress styles
import componentStyles from './testimonials.css?inline'; // For Shadow DOM

export class Testimonials extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    testimonials: { type: Array }
  };

  constructor() {
    super();
    this.title = 'Testimonios de nuestros estudiantes';
    this.subtitle = 'Descubre lo que dicen sobre nosotros';
    this.testimonials = [];
  }

  // 🏆 MEJOR PRÁCTICA: Vite ?inline es el estándar moderno
  static styles = css`${unsafeCSS(componentStyles)}`;

  render() {
    return html`
      <section class="testimonials-section">
        <div class="testimonials-container">
          <div class="testimonials-header">
            <h2 class="testimonials-title">${this.title}</h2>
            <p class="testimonials-subtitle">${this.subtitle}</p>
          </div>

          <div class="testimonials-grid">
            ${this.testimonials.map(testimonial => html`
              <div class="testimonial-card">
                <div class="rating">
                  ${this.renderStars(testimonial.rating)}
                </div>
                <p class="testimonial-content">"${testimonial.content}"</p>
                <div class="testimonial-author">
                  ${testimonial.user_photo ? html`
                    <img
                      src="${testimonial.user_photo}"
                      alt="${testimonial.name}"
                      class="author-avatar"
                    />
                  ` : html`
                    <div class="author-avatar" style="background: var(--tl-primary-500); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                      ${testimonial.name.charAt(0).toUpperCase()}
                    </div>
                  `}
                  <div class="author-info">
                    <div class="author-name">${testimonial.name}</div>
                    <div class="author-role">${testimonial.role}</div>
                    ${testimonial.course ? html`
                      <div class="author-course">${testimonial.course}</div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </section>
    `;
  }

  renderStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(html`
        <span class="star">${i <= rating ? '★' : '☆'}</span>
      `);
    }
    return stars;
  }
}

customElements.define('tl-testimonials', Testimonials);
