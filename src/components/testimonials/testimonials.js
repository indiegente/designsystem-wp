import { LitElement, html, css } from 'lit';

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

  static styles = css`
    :host {
      display: block;
    }

    .testimonials-section {
      padding: var(--tl-spacing-12) 0;
      background: var(--tl-neutral-50);
    }

    .testimonials-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--tl-spacing-6);
    }

    .testimonials-header {
      text-align: center;
      margin-bottom: var(--tl-spacing-12);
    }

    .testimonials-title {
      font-size: var(--tl-font-size-3xl);
      font-weight: var(--tl-font-weight-bold);
      color: var(--tl-neutral-900);
      margin-bottom: var(--tl-spacing-4);
    }

    .testimonials-subtitle {
      font-size: var(--tl-font-size-lg);
      color: var(--tl-neutral-600);
      max-width: 600px;
      margin: 0 auto;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: var(--tl-spacing-8);
    }

    .testimonial-card {
      background: white;
      border-radius: 12px;
      padding: var(--tl-spacing-8);
      box-shadow: var(--tl-shadow-lg);
      border: 1px solid var(--tl-neutral-200);
      transition: var(--tl-transition-normal);
    }

    .testimonial-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    }

    .testimonial-content {
      font-size: var(--tl-font-size-lg);
      color: var(--tl-neutral-700);
      line-height: 1.6;
      margin-bottom: var(--tl-spacing-6);
      font-style: italic;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: var(--tl-spacing-4);
    }

    .author-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--tl-primary-500);
    }

    .author-info {
      flex: 1;
    }

    .author-name {
      font-size: var(--tl-font-size-lg);
      font-weight: var(--tl-font-weight-semibold);
      color: var(--tl-neutral-900);
      margin-bottom: var(--tl-spacing-1);
    }

    .author-role {
      font-size: var(--tl-font-size-sm);
      color: var(--tl-neutral-600);
    }

    .author-course {
      font-size: var(--tl-font-size-sm);
      color: var(--tl-primary-600);
      font-weight: var(--tl-font-weight-medium);
    }

    .rating {
      display: flex;
      gap: var(--tl-spacing-1);
      margin-bottom: var(--tl-spacing-4);
    }

    .star {
      color: #fbbf24;
      font-size: var(--tl-font-size-lg);
    }

    @media (max-width: 768px) {
      .testimonials-grid {
        grid-template-columns: 1fr;
        gap: var(--tl-spacing-6);
      }

      .testimonials-title {
        font-size: var(--tl-font-size-2xl);
      }

      .testimonial-card {
        padding: var(--tl-spacing-6);
      }
    }
  `;

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
                  ${testimonial.avatar ? html`
                    <img 
                      src="${testimonial.avatar}" 
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
