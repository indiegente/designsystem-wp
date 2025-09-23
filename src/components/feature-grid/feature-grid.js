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

  static styles = css``;

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
