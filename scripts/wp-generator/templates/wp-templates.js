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

<header class="site-header">
    <div class="container">
        <h1 class="site-title">
            <a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>
        </h1>
        
        <nav class="main-navigation">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'container' => false,
                'menu_class' => 'nav-menu'
            ));
            ?>
        </nav>
    </div>
</header>`;
  }

  generateFooterTemplate() {
    return `<footer class="site-footer">
    <div class="container">
        <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. Todos los derechos reservados.</p>
        
        <nav class="footer-navigation">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'footer',
                'container' => false,
                'menu_class' => 'footer-menu'
            ));
            ?>
        </nav>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>`;
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
?>

<main class="error-404-content">
    <div class="container">
        <h1>404 - Página no encontrada</h1>
        <p>Lo sentimos, la página que buscas no existe.</p>
        
        <div class="search-form">
            <?php get_search_form(); ?>
        </div>
        
        <a href="<?php echo esc_url(home_url('/')); ?>" class="btn-home">
            Volver al inicio
        </a>
    </div>
</main>

<?php get_footer(); ?>`;
  }

  generateSearchTemplate() {
    return `<?php
get_header();
?>

<main class="search-results">
    <div class="container">
        <h1>Resultados de búsqueda para: "<?php the_search_query(); ?>"</h1>
        
        <?php if (have_posts()) : ?>
            <div class="search-results-list">
                <?php while (have_posts()) : the_post(); ?>
                    <article class="search-result-item">
                        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                        <div class="excerpt"><?php the_excerpt(); ?></div>
                    </article>
                <?php endwhile; ?>
            </div>
            
            <?php the_posts_pagination(); ?>
        <?php else : ?>
            <p>No se encontraron resultados para tu búsqueda.</p>
            <?php get_search_form(); ?>
        <?php endif; ?>
    </div>
</main>

<?php get_footer(); ?>`;
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