import { LitElement, html, css } from 'lit';

export class Error404 extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    description: { type: String },
    homeUrl: { type: String },
    homeText: { type: String },
    searchPlaceholder: { type: String },
    showSearch: { type: Boolean },
    showSuggestions: { type: Boolean },
    suggestions: { type: Array }
  };

  constructor() {
    super();
    this.title = '404';
    this.subtitle = 'Página no encontrada';
    this.description = 'Lo sentimos, la página que buscas no existe o ha sido movida.';
    this.homeUrl = '/';
    this.homeText = 'Volver al inicio';
    this.searchPlaceholder = 'Buscar contenido...';
    this.showSearch = true;
    this.showSuggestions = true;
    this.suggestions = [
      { title: 'Carreras', url: '/carreras', description: 'Explora nuestras carreras técnicas' },
      { title: 'Contacto', url: '/contacto', description: 'Ponte en contacto con nosotros' },
      { title: 'Inicio', url: '/', description: 'Volver a la página principal' }
    ];
  }

  static styles = css``;

  handleSearch(e) {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    if (searchTerm.trim()) {
      // Redirect to search page
      window.location.href = `/?s=${encodeURIComponent(searchTerm)}`;
    }
  }

  render() {
    return html`
      <div class="error-404">
        <div class="error-content">
          <h1 class="error-number">${this.title}</h1>
          <h2 class="error-title">${this.subtitle}</h2>
          <p class="error-description">${this.description}</p>

          <div class="error-actions">
            <a href="${this.homeUrl}" class="home-button">${this.homeText}</a>

            ${this.showSearch ? html`
              <form class="search-form" @submit="${this.handleSearch}">
                <input
                  type="search"
                  name="search"
                  class="search-input"
                  placeholder="${this.searchPlaceholder}"
                  autocomplete="off"
                />
              </form>
            ` : ''}
          </div>

          ${this.showSuggestions && this.suggestions.length > 0 ? html`
            <div class="suggestions">
              <h3 class="suggestions-title">Páginas populares</h3>
              <ul class="suggestions-list">
                ${this.suggestions.map(suggestion => html`
                  <li class="suggestion-item">
                    <a href="${suggestion.url}" class="suggestion-link">
                      <h4 class="suggestion-title">${suggestion.title}</h4>
                      <p class="suggestion-description">${suggestion.description}</p>
                    </a>
                  </li>
                `)}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('error-404', Error404);