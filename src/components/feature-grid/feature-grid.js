import { LitElement, html, css } from 'lit';

export class FeatureGrid extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    features: { type: Array }
  };

  constructor() {
    super();
    this.title = 'Nuestras características';
    this.subtitle = 'Descubre lo que nos hace únicos';
    this.features = [];
  }

  static styles = css`
    :host {
      display: block;
    }

    .feature-grid-section {
      padding: var(--tl-spacing-16) 0;
      background: var(--tl-neutral-100);
    }

    .feature-grid-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--tl-spacing-6);
    }

    .feature-grid-header {
      text-align: center;
      margin-bottom: var(--tl-spacing-12);
    }

    .feature-grid-title {
      font-size: var(--tl-font-size-3xl);
      font-weight: var(--tl-font-weight-bold);
      color: var(--tl-neutral-900);
      margin-bottom: var(--tl-spacing-4);
    }

    .feature-grid-subtitle {
      font-size: var(--tl-font-size-lg);
      color: var(--tl-neutral-600);
      max-width: 600px;
      margin: 0 auto;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--tl-spacing-8);
    }

    .feature-card {
      background: white;
      border-radius: 12px;
      padding: var(--tl-spacing-8);
      box-shadow: var(--tl-shadow-md);
      border: 1px solid var(--tl-neutral-200);
      transition: var(--tl-transition-normal);
      text-align: center;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--tl-shadow-lg);
    }

    .feature-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto var(--tl-spacing-6);
      background: var(--tl-primary-500);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--tl-font-size-2xl);
    }

    .feature-title {
      font-size: var(--tl-font-size-xl);
      font-weight: var(--tl-font-weight-semibold);
      color: var(--tl-neutral-900);
      margin-bottom: var(--tl-spacing-4);
    }

    .feature-description {
      font-size: var(--tl-font-size-base);
      color: var(--tl-neutral-700);
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .feature-grid {
        grid-template-columns: 1fr;
        gap: var(--tl-spacing-6);
      }

      .feature-grid-title {
        font-size: var(--tl-font-size-2xl);
      }
    }
  `;

  render() {
    return html`
      <section class="feature-grid-section">
        <div class="feature-grid-container">
          <div class="feature-grid-header">
            <h2 class="feature-grid-title">${this.title}</h2>
            <p class="feature-grid-subtitle">${this.subtitle}</p>
          </div>

          <div class="feature-grid">
            ${this.features.map(feature => html`
              <div class="feature-card">
                <div class="feature-icon">
                  ${feature.icon || '✨'}
                </div>
                <h3 class="feature-title">${feature.title}</h3>
                <p class="feature-description">${feature.description}</p>
              </div>
            `)}
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('tl-feature-grid', FeatureGrid);
