import { LitElement, html, css } from 'lit';

export class SiteFooter extends LitElement {
  static properties = {
    siteName: { type: String },
    showCopyright: { type: Boolean },
    showNavigation: { type: Boolean },
    navigationItems: { type: Array },
    socialLinks: { type: Array },
    customText: { type: String }
  };

  constructor() {
    super();
    this.siteName = 'Design System Site';
    this.showCopyright = true;
    this.showNavigation = true;
    this.navigationItems = [
      { title: 'Política de Privacidad', url: '/privacidad' },
      { title: 'Términos de Uso', url: '/terminos' },
      { title: 'Contacto', url: '/contacto' }
    ];
    this.socialLinks = [
      { title: 'Facebook', url: '#', icon: '📘' },
      { title: 'Instagram', url: '#', icon: '📷' },
      { title: 'LinkedIn', url: '#', icon: '💼' }
    ];
    this.customText = 'Todos los derechos reservados.';
  }

  static styles = css``;

  getCurrentYear() {
    return new Date().getFullYear();
  }

  render() {
    return html`
      <footer class="site-footer">
        <div class="container">
          <div class="footer-content">
            ${this.showNavigation ? html`
              <div class="footer-section">
                <h3>Enlaces</h3>
                <nav class="footer-navigation">
                  <ul class="footer-menu">
                    ${this.navigationItems.map(item => html`
                      <li>
                        <a href="${item.url}" class="footer-link">${item.title}</a>
                      </li>
                    `)}
                  </ul>
                </nav>
              </div>
            ` : ''}

            <div class="footer-section">
              <h3>Síguenos</h3>
              <div class="social-links">
                ${this.socialLinks.map(link => html`
                  <a href="${link.url}" class="social-link" title="${link.title}">
                    ${link.icon}
                  </a>
                `)}
              </div>
            </div>
          </div>

          ${this.showCopyright ? html`
            <div class="footer-bottom">
              <p class="copyright">
                &copy; ${this.getCurrentYear()} ${this.siteName}. ${this.customText}
              </p>
            </div>
          ` : ''}
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);