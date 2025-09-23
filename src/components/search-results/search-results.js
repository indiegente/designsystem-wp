import { LitElement, html, css } from 'lit';

export class SearchResults extends LitElement {
  static properties = {
    searchTerm: { type: String },
    totalResults: { type: Number },
    results: { type: Array },
    showNoResults: { type: Boolean },
    noResultsTitle: { type: String },
    noResultsMessage: { type: String },
    showSuggestions: { type: Boolean },
    suggestions: { type: Array }
  };

  constructor() {
    super();
    this.searchTerm = '';
    this.totalResults = 0;
    this.results = [];
    this.showNoResults = false;
    this.noResultsTitle = 'No se encontraron resultados';
    this.noResultsMessage = 'Intenta con otros términos de búsqueda o revisa las sugerencias a continuación.';
    this.showSuggestions = true;
    this.suggestions = [
      { title: 'Carreras', url: '/carreras', description: 'Explora nuestras carreras técnicas' },
      { title: 'Contacto', url: '/contacto', description: 'Ponte en contacto con nosotros' },
      { title: 'Inicio', url: '/', description: 'Volver a la página principal' }
    ];
  }

  static styles = css``;

  formatResultCount() {
    if (this.totalResults === 0) return '';
    if (this.totalResults === 1) return '1 resultado encontrado';
    return `${this.totalResults} resultados encontrados`;
  }

  highlightSearchTerm(text) {
    if (!this.searchTerm || !text) return text;
    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  render() {
    return html`
      <div class="search-results">
        <div class="search-header">
          <h1 class="search-title">
            ${this.searchTerm ? html`
              Resultados para: <span class="search-term">"${this.searchTerm}"</span>
            ` : 'Resultados de búsqueda'}
          </h1>
          ${this.totalResults > 0 ? html`
            <p class="search-info">${this.formatResultCount()}</p>
          ` : ''}
        </div>

        ${this.results.length > 0 ? html`
          <ul class="results-list">
            ${this.results.map(result => html`
              <li class="result-item">
                <h2 class="result-title">
                  <a href="${result.url}" class="result-link">
                    ${result.title}
                  </a>
                </h2>
                ${result.excerpt ? html`
                  <p class="result-excerpt">${result.excerpt}</p>
                ` : ''}
                <div class="result-meta">
                  <a href="${result.url}" class="result-url">${result.url}</a>
                  ${result.date ? html` • ${result.date}` : ''}
                  ${result.type ? html` • ${result.type}` : ''}
                </div>
              </li>
            `)}
          </ul>
        ` : ''}

        ${this.showNoResults || this.results.length === 0 ? html`
          <div class="no-results">
            <h2 class="no-results-title">${this.noResultsTitle}</h2>
            <p class="no-results-message">${this.noResultsMessage}</p>
          </div>
        ` : ''}

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
    `;
  }
}

customElements.define('search-results', SearchResults);