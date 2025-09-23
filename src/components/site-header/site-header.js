import { LitElement, html, css } from 'lit';

export class SiteHeader extends LitElement {
  static properties = {
    siteName: { type: String },
    homeUrl: { type: String },
    showNavigation: { type: Boolean },
    navigationItems: { type: Array }
  };

  constructor() {
    super();
    this.siteName = 'Design System Site';
    this.homeUrl = '/';
    this.showNavigation = true;
    this.navigationItems = [
      { title: 'Inicio', url: '/' },
      { title: 'Carreras', url: '/carreras' },
      { title: 'Contacto', url: '/contacto' }
    ];
  }

  static styles = css``;

  render() {
    return html`
      <header class="site-header">
        <div class="container">
          <h1 class="site-title">
            <a href="${this.homeUrl}">${this.siteName}</a>
          </h1>

          ${this.showNavigation ? html`
            <nav class="main-navigation">
              <ul class="nav-menu">
                ${this.navigationItems.map(item => html`
                  <li class="nav-item">
                    <a href="${item.url}" class="nav-link">${item.title}</a>
                  </li>
                `)}
              </ul>
            </nav>
          ` : ''}
        </div>
      </header>
    `;
  }
}

customElements.define('site-header', SiteHeader);