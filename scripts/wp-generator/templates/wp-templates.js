const fs = require('fs');
const path = require('path');
const DynamicPageTemplates = require('./dynamic-page-templates');

class WpTemplates {
  constructor(config) {
    this.config = config;
    this.components = this.getAvailableComponents();
    this.dynamicTemplates = new DynamicPageTemplates(config);
  }

  getAvailableComponents() {
    const componentsDir = path.join(this.config.srcDir, 'components');
    if (!fs.existsSync(componentsDir)) return [];
    
    return fs.readdirSync(componentsDir)
      .filter(item => fs.statSync(path.join(componentsDir, item)).isDirectory())
      .map(component => component.replace('-', '_'));
  }

  generateTemplateName(templateName) {
    return templateName
      .replace('page-', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  generateBasicTemplate(templateName) {
    return `<?php
/*
Template Name: ${this.generateTemplateName(templateName)}
*/
get_header();
?>

<main class="${templateName}-content">
    <h1><?php the_title(); ?></h1>
    <?php the_content(); ?>
</main>

<?php get_footer(); ?>`;
  }

  generateHeaderTemplate() {
    return `<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php
// Include and render site-header component
require_once get_template_directory() . '/components/site-header/site-header.php';
render_site_header();
?>`;
  }

  generateFooterTemplate() {
    return `<?php
// Include and render site-footer component
require_once get_template_directory() . '/components/site-footer/site-footer.php';
render_site_footer();
?>

<?php wp_footer(); ?>
</body>
</html>`;;
  }

  generateFrontPageTemplate() {
    const componentIncludes = this.components
      .map(component => `require_once get_template_directory() . '/components/${component.replace('_', '-')}/${component.replace('_', '-')}.php';`)
      .join('\n');

    return `<?php
get_header();

// Incluir componentes disponibles
${componentIncludes}

// Aquí puedes agregar la lógica específica de tu página de inicio
// usando los componentes disponibles: ${this.components.join(', ')}
?>

<main class="home-content">
    <!-- Contenido dinámico basado en el design system -->
</main>

<?php get_footer(); ?>`;
  }

  generateErrorTemplate() {
    return `<?php
get_header();

// Include and render error-404 component
require_once get_template_directory() . '/components/error-404/error-404.php';
render_error_404();

get_footer();
?>`;;
  }

  generateSearchTemplate() {
    return `<?php
get_header();

// Include and render search-results component
require_once get_template_directory() . '/components/search-results/search-results.php';
render_search_results();

get_footer();
?>`;;
  }

  generate(templateName) {
    // Templates básicos de WordPress
    const basicTemplates = {
      'header': this.generateHeaderTemplate(),
      'footer': this.generateFooterTemplate(),
      '404': this.generateErrorTemplate(),
      'search': this.generateSearchTemplate(),
      'front-page': this.generateFrontPageTemplate()
    };

    // Si es un template básico, retornarlo
    if (basicTemplates[templateName]) {
      return basicTemplates[templateName];
    }

    // Para templates de página, usar el generador dinámico
    if (templateName.startsWith('page-')) {
      return this.dynamicTemplates.generate(templateName);
    }

    // Template genérico para cualquier otro caso
    return this.generateBasicTemplate(templateName);
  }
}

module.exports = WpTemplates;