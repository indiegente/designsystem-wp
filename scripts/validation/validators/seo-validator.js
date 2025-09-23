const ValidatorInterface = require('../core/validator-interface');

/**
 * SEO Validator
 *
 * Valida elementos SEO en el HTML generado:
 * - Meta tags básicos
 * - OpenGraph tags
 * - Twitter Cards
 * - JSON-LD structured data
 * - Canonical URLs
 */
class SEOValidator extends ValidatorInterface {
  constructor(config = {}) {
    super('SEO Validator', config);
    this.requiredSources = ['html'];
  }

  /**
   * Ejecuta validaciones SEO
   * @param {Object} sources - Fuentes de datos ({ html: string })
   * @param {Object} context - Contexto ({ url?, page?, type? })
   */
  async validate(sources, context = {}) {
    // Manejar fuente HTML que puede tener errores
    let html = '';
    if (sources.html) {
      // Si html es un objeto con metadata de error
      if (typeof sources.html === 'object' && sources.html[context.page]) {
        const pageData = sources.html[context.page];
        if (pageData.error) {
          this.assert(false, `No se pudo obtener HTML: ${pageData.error}`, 'error',
            { type: 'html-fetch-error', url: pageData.url });
          return;
        }
        html = pageData.html || '';
      } else if (typeof sources.html === 'string') {
        html = sources.html;
      }
    }

    const { url = 'unknown', page = 'unknown' } = context;

    console.log(`   🔍 Validando SEO para ${page}...`);

    // Validaciones básicas de meta tags
    this.validateBasicMetaTags(html, context);

    // Validaciones de OpenGraph
    this.validateOpenGraph(html, context);

    // Validaciones de Twitter Cards
    this.validateTwitterCards(html);

    // Validaciones de JSON-LD structured data
    this.validateStructuredData(html);

    // Validaciones de canonical URL
    this.validateCanonicalURL(html);

    // Validaciones específicas por tipo de página
    this.validatePageTypeSpecific(html, context);
  }

  /**
   * Valida meta tags básicos
   */
  validateBasicMetaTags(html, context = {}) {
    const { page = 'unknown', url } = context;
    const location = url ? `${page} (${url})` : page;

    // Meta description
    this.assert(
      html.includes('<meta name="description"'),
      `Meta description debe estar presente en ${location}`,
      'error',
      { type: 'meta-description', page, url }
    );

    // Meta keywords (opcional pero recomendado)
    this.assert(
      html.includes('<meta name="keywords"'),
      `Meta keywords recomendado para SEO en ${location}`,
      'warning',
      { type: 'meta-keywords', page, url }
    );

    // Title tag
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      this.assert(
        title.length > 0,
        `Title tag no debe estar vacío en ${location}`,
        'error',
        { type: 'title', value: title, page, url }
      );

      this.assert(
        title.length <= 60,
        `Title tag demasiado largo: ${title.length} caracteres en ${location} (recomendado: ≤60)`,
        'warning',
        { type: 'title-length', length: title.length, page, url }
      );
    } else {
      this.assert(false, `Title tag faltante en ${location}`, 'error', { type: 'title', page, url });
    }

    // Meta viewport para mobile
    this.assert(
      html.includes('name="viewport"'),
      'Meta viewport necesario para responsive design',
      'warning',
      { type: 'viewport' }
    );
  }

  /**
   * Valida OpenGraph tags
   */
  validateOpenGraph(html, context = {}) {
    const { page = 'unknown', url } = context;
    const location = url ? `${page} (${url})` : page;

    const ogTags = [
      { tag: 'og:title', required: true },
      { tag: 'og:description', required: true },
      { tag: 'og:type', required: true },
      { tag: 'og:url', required: false },
      { tag: 'og:image', required: false }
    ];

    ogTags.forEach(({ tag, required }) => {
      const present = html.includes(`property="${tag}"`);
      const type = required ? 'error' : 'warning';
      const message = required
        ? `OpenGraph ${tag} es obligatorio para compartir en redes sociales en ${location}`
        : `OpenGraph ${tag} recomendado para mejor presentación en ${location}`;

      this.assert(present, message, type, { type: 'opengraph', tag, page, url });
    });

    // Validar contenido de og:image si existe
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (ogImageMatch) {
      const imageUrl = ogImageMatch[1];
      this.assert(
        imageUrl.startsWith('http') || imageUrl.startsWith('//'),
        'og:image debe ser una URL absoluta',
        'warning',
        { type: 'og-image-url', url: imageUrl }
      );
    }
  }

  /**
   * Valida Twitter Cards
   */
  validateTwitterCards(html) {
    const hasTwitterCard = html.includes('name="twitter:card"');

    this.assert(
      hasTwitterCard,
      'Twitter Card recomendada para compartir en Twitter',
      'warning',
      { type: 'twitter-card' }
    );

    if (hasTwitterCard) {
      // Si hay twitter card, validar tags relacionados
      this.assert(
        html.includes('name="twitter:title"') || html.includes('property="og:title"'),
        'Twitter title necesario (twitter:title o og:title)',
        'warning',
        { type: 'twitter-title' }
      );

      this.assert(
        html.includes('name="twitter:description"') || html.includes('property="og:description"'),
        'Twitter description necesaria (twitter:description o og:description)',
        'warning',
        { type: 'twitter-description' }
      );
    }
  }

  /**
   * Valida JSON-LD structured data
   */
  validateStructuredData(html) {
    const hasJsonLd = html.includes('application/ld+json');

    this.assert(
      hasJsonLd,
      'JSON-LD structured data recomendado para mejor SEO',
      'warning',
      { type: 'json-ld' }
    );

    if (hasJsonLd) {
      // Extraer y validar JSON-LD
      const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);

      if (jsonLdMatches) {
        jsonLdMatches.forEach((match, index) => {
          try {
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
            const data = JSON.parse(jsonContent);

            this.assert(
              data['@type'] || data.type,
              `JSON-LD ${index + 1} debe tener @type`,
              'warning',
              { type: 'json-ld-type', index: index + 1 }
            );

            this.assert(
              data['@context'] || data.context,
              `JSON-LD ${index + 1} debe tener @context`,
              'warning',
              { type: 'json-ld-context', index: index + 1 }
            );

          } catch (error) {
            this.assert(
              false,
              `JSON-LD ${index + 1} malformado: ${error.message}`,
              'error',
              { type: 'json-ld-syntax', error: error.message, index: index + 1 }
            );
          }
        });
      }
    }
  }

  /**
   * Valida canonical URL
   */
  validateCanonicalURL(html) {
    const hasCanonical = html.includes('rel="canonical"');

    this.assert(
      hasCanonical,
      'Canonical URL recomendada para evitar contenido duplicado',
      'warning',
      { type: 'canonical' }
    );

    if (hasCanonical) {
      const canonicalMatch = html.match(/rel="canonical"\s+href="([^"]+)"/);
      if (canonicalMatch) {
        const canonicalUrl = canonicalMatch[1];

        // Validar formato de URL
        this.assert(
          canonicalUrl.startsWith('http') || canonicalUrl.startsWith('/'),
          'Canonical URL debe ser absoluta o relativa válida',
          'warning',
          { type: 'canonical-format', url: canonicalUrl }
        );
      }
    }
  }

  /**
   * Validaciones específicas por tipo de página
   */
  validatePageTypeSpecific(html, context) {
    const { type, page } = context;

    // Validaciones para páginas de carreras
    if (page && page.includes('carrera')) {
      this.validateCoursePageSEO(html, context);
    }

    // Validaciones para página de contacto
    if (page && page.includes('contacto')) {
      this.validateContactPageSEO(html, context);
    }

    // Validaciones para homepage
    if (type === 'front-page' || page === 'homepage') {
      this.validateHomepageSEO(html, context);
    }
  }

  /**
   * Validaciones específicas para páginas de carreras
   */
  validateCoursePageSEO(html, context) {
    // Schema.org Course recomendado
    this.assert(
      html.includes('"@type":"Course"') || html.includes('"@type": "Course"'),
      'Schema Course recomendado para páginas de carreras',
      'warning',
      { type: 'schema-course' }
    );

    // Keywords relacionadas con educación
    const educationKeywords = ['carrera', 'curso', 'educación', 'estudio', 'técnico'];
    const hasEducationKeywords = educationKeywords.some(keyword =>
      html.toLowerCase().includes(keyword)
    );

    this.assert(
      hasEducationKeywords,
      'Contenido debe incluir keywords relacionadas con educación',
      'warning',
      { type: 'education-keywords' }
    );
  }

  /**
   * Validaciones específicas para página de contacto
   */
  validateContactPageSEO(html, context) {
    // Schema.org ContactPage recomendado
    this.assert(
      html.includes('"@type":"ContactPage"') || html.includes('"@type": "ContactPage"'),
      'Schema ContactPage recomendado para página de contacto',
      'warning',
      { type: 'schema-contact' }
    );

    // Información de contacto estructurada
    const hasContactInfo = html.includes('telephone') || html.includes('email') ||
                          html.includes('address') || html.includes('PostalAddress');

    this.assert(
      hasContactInfo,
      'Información de contacto estructurada recomendada',
      'warning',
      { type: 'contact-info' }
    );
  }

  /**
   * Validaciones específicas para homepage
   */
  validateHomepageSEO(html, context) {
    // Schema.org Organization recomendado
    this.assert(
      html.includes('"@type":"Organization"') || html.includes('"@type": "Organization"'),
      'Schema Organization recomendado para homepage',
      'warning',
      { type: 'schema-organization' }
    );

    // Logo de la organización
    this.assert(
      html.includes('"logo"') || html.includes('logo'),
      'Logo de organización recomendado en homepage',
      'warning',
      { type: 'organization-logo' }
    );
  }

  /**
   * Valida performance SEO (no bloquea pero informa)
   */
  validateSEOPerformance(html) {
    // Cantidad de H1 tags
    const h1Matches = html.match(/<h1[^>]*>/gi);
    const h1Count = h1Matches ? h1Matches.length : 0;

    this.assert(
      h1Count === 1,
      `Se recomienda exactamente un H1 por página (encontrados: ${h1Count})`,
      'warning',
      { type: 'h1-count', count: h1Count }
    );

    // Jerarquía de headings
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    let lastLevel = 0;
    let hierarchyIssues = 0;

    headings.forEach((tag, index) => {
      const level = index + 1;
      const matches = html.match(new RegExp(`<${tag}[^>]*>`, 'gi'));
      if (matches && matches.length > 0) {
        if (lastLevel > 0 && level > lastLevel + 1) {
          hierarchyIssues++;
        }
        lastLevel = level;
      }
    });

    this.assert(
      hierarchyIssues === 0,
      'Jerarquía de headings debe ser secuencial (H1 → H2 → H3...)',
      'warning',
      { type: 'heading-hierarchy', issues: hierarchyIssues }
    );
  }
}

module.exports = SEOValidator;