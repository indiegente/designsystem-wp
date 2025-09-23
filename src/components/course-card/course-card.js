import { LitElement, html, css } from 'lit';
import './course-card.css'; // For Storybook individual imports

export class CourseCard extends LitElement {
  static properties = {
    title: { type: String },
    description: { type: String },
    image: { type: String },
    link: { type: String },
    linkText: { type: String }
  };

  constructor() {
    super();
    this.title = '';
    this.description = '';
    this.image = '';
    this.link = '#';
    this.linkText = 'Ver más';
  }

  static styles = css``;

  render() {
    return html`
      <div class="course-card">
        ${this.image ? html`
          <img 
            src="${this.image}" 
            alt="${this.title}"
            class="course-image"
          />
        ` : html`
          <div class="course-image"></div>
        `}
        
        <div class="course-content">
          <h3 class="course-title">${this.title}</h3>
          <p class="course-description">${this.description}</p>
          <a href="${this.link}" class="course-link">${this.linkText}</a>
        </div>
      </div>
    `;
  }
}

customElements.define('course-card', CourseCard);