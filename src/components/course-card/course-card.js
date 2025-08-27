import { LitElement, html, css } from 'lit';

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

  static styles = css`
    :host {
      display: block;
    }

    .course-card {
      background: white;
      border-radius: 8px;
      box-shadow: var(--tl-shadow-lg);
      overflow: hidden;
      transition: var(--tl-transition-normal);
    }

    .course-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    }

    .course-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: var(--tl-neutral-100);
    }

    .course-content {
      padding: var(--tl-spacing-6);
    }

    .course-title {
      font-family: var(--tl-font-primary);
      font-size: var(--tl-font-size-lg);
      font-weight: var(--tl-font-weight-semibold);
      color: var(--tl-neutral-900);
      margin: 0 0 var(--tl-spacing-4) 0;
    }

    .course-description {
      font-family: var(--tl-font-primary);
      color: var(--tl-neutral-900);
      margin: 0 0 var(--tl-spacing-6) 0;
      line-height: 1.5;
    }

    .course-link {
      display: inline-block;
      background: var(--tl-primary-500);
      color: white;
      padding: var(--tl-spacing-4) var(--tl-spacing-6);
      border-radius: 6px;
      text-decoration: none;
      font-family: var(--tl-font-primary);
      font-weight: var(--tl-font-weight-semibold);
      transition: var(--tl-transition-normal);
    }

    .course-link:hover {
      background: var(--tl-primary-600);
    }
  `;

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