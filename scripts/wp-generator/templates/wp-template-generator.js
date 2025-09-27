const fs = require('fs');
const path = require('path');
const ComponentGenerator = require('../managers/component-generator');

/**
 * WpTemplateGenerator - Generador Consolidado de Templates WordPress
 *
 * ✅ CONSOLIDACIÓN COMPLETA:
 * - Fusión de wp-templates.js + dynamic-page-templates.js
 * - Eliminación de duplicación de código
 * - Responsabilidad única: Generación de todos los templates
 *
 * 🎯 FUNCIONALIDADES:
 * - Templates básicos de WordPress (header, footer, 404, search, front-page)
 * - Templates dinámicos desde page-templates.json
 * - Generación de componentes con extensiones
 * - Sistema SEO y Analytics integrado
 */
class WpTemplateGenerator {
  constructor(config) {
    this.config = config;
    this.pageConfig = this.loadPageConfig();
    this.componentGenerator = new ComponentGenerator(config);
    this.components = this.getAvailableComponents();
  }

  loadPageConfig() {
    const configPath = path.join(this.config.srcDir, 'page-templates.json');
    if (!fs.existsSync(configPath)) {
      console.warn('⚠️ No se encontró page-templates.json, usando configuración por defecto');
      return {};
    }

    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error cargando page-templates.json:', error.message);
      return {};
    }
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
    <?php
    // Loop de WordPress - buenas prácticas
    if (have_posts()) :
        while (have_posts()) : the_post();
            ?>
            <h1><?php the_title(); ?></h1>
            <?php the_content(); ?>
            <?php
        endwhile;
    endif;
    ?>
</main>

<?php get_footer(); ?>`;
  }

  // ===============================================
  // TEMPLATES BÁSICOS DE WORDPRESS (ESTÁTICOS)
  // ===============================================

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

// Include and render error-404 component
require_once get_template_directory() . '/components/error-404/error-404.php';
render_error_404();

get_footer();
?>`;
  }

  generateSearchTemplate() {
    return `<?php
get_header();

// Include and render search-results component
require_once get_template_directory() . '/components/search-results/search-results.php';
render_search_results();

get_footer();
?>`;
  }

  generateIndexTemplate() {
    return `<?php
get_header();
?>

<main class="blog-content">
    <?php
    if (have_posts()) :
        while (have_posts()) : the_post();
            ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                <header class="entry-header">
                    <h2 class="entry-title">
                        <a href="<?php the_permalink(); ?>" rel="bookmark"><?php the_title(); ?></a>
                    </h2>
                </header>

                <div class="entry-content">
                    <?php the_excerpt(); ?>
                </div>
            </article>
            <?php
        endwhile;
    else :
        ?>
        <p>No hay posts disponibles.</p>
        <?php
    endif;
    ?>
</main>

<?php get_footer(); ?>`;
  }

  // ===============================================
  // TEMPLATES DINÁMICOS DESDE CONFIGURACIÓN
  // ===============================================

  generateSEOTags(seo) {
    if (!seo) return '';

    return `
    <!-- SEO Meta Tags -->
    <title><?php echo esc_html('${seo.title}'); ?></title>
    <meta name="description" content="<?php echo esc_attr('${seo.description}'); ?>">
    <meta name="keywords" content="<?php echo esc_attr('${seo.keywords}'); ?>">

    <!-- Open Graph -->
    <meta property="og:title" content="<?php echo esc_attr('${seo.title}'); ?>">
    <meta property="og:description" content="<?php echo esc_attr('${seo.description}'); ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo esc_url(home_url('${seo.canonical}')); ?>">
    ${seo.ogImage ? `<meta property="og:image" content="<?php echo esc_url('${seo.ogImage}'); ?>">` : ''}

    <!-- Canonical -->
    <link rel="canonical" href="<?php echo esc_url(home_url('${seo.canonical}')); ?>">`;
  }

  generateAnalyticsCode(analytics) {
    if (!analytics) return '';

    const events = analytics.events || [];
    const eventCode = events.map(event => `
    // ${event.name}
    document.addEventListener("DOMContentLoaded", function() {
      // Implementar tracking para ${event.name}
      // gtag("event", "${event.action}", {
      //   "event_category": "${event.category}",
      //   "event_label": "${event.label}"
      // });
    });`).join('');

    return `
    <!-- Analytics -->
    <script>
    // Page View: ${analytics.pageView}
    // gtag("config", "GA_MEASUREMENT_ID", {
    //   "page_title": "${analytics.pageView}",
    //   "page_location": window.location.href
    // });
    ${eventCode}
    </script>`;
  }

  generateComponentInclude(component) {
    return `require_once get_template_directory() . '/components/${component.name}/${component.name}.php';`;
  }

  async generateComponentRender(component, index) {
    // Usar el nuevo generador basado en metadata con soporte para extensiones
    return await this.componentGenerator.generateComponentCode(component, component.dataSource);
  }

  async generatePageTemplate(pageName) {
    const pageConfig = this.pageConfig[pageName];

    // Validar que la página tenga template asignado
    if (pageConfig.template) {
      // Cargar metadatos de templates
      const metadataPath = path.join(this.config.srcDir, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const templateConfig = metadata.templates && metadata.templates[pageConfig.template];
        if (templateConfig) {
          // Mergear configuración de template con datos de página
          pageConfig.templateConfig = templateConfig;
        }
      }
    }

    // Contexto para extensiones
    const context = {
      pageName,
      pageConfig,
      config: this.config
    };

    // Ejecutar hooks antes de la generación del template
    await this.componentGenerator.extensionManager.executeBeforeTemplateGeneration(pageName, context);

    if (!pageConfig) {
      // Fallback a template básico
      return this.generateBasicTemplate(pageName);
    }

    const components = pageConfig.components || [];

    const componentIncludes = components
      .map(component => this.generateComponentInclude(component))
      .join('\n');

    // Generar renders de componentes de forma asíncrona
    const componentRendersPromises = components.map((component, index) =>
      this.generateComponentRender(component, index)
    );
    const componentRenders = await Promise.all(componentRendersPromises);
    const componentRendersString = componentRenders.join('\n\n    ');

    let result = `<?php
/*
Template Name: ${this.generateTemplateName(pageName)}
*/

get_header();

// Incluir componentes
${componentIncludes}
?>

<main class="${pageName}-content">
    <?php
    // Loop de WordPress - buenas prácticas
    if (have_posts()) :
        while (have_posts()) : the_post();
            ?>
            <!-- Componentes renderizados desde configuración -->
            ${componentRendersString}

            <!-- Contenido de la página -->
            <?php the_content(); ?>
            <?php
        endwhile;
    endif;
    ?>
</main>

<?php get_footer(); ?>`;

    // Ejecutar hooks después de la generación del template
    result = await this.componentGenerator.extensionManager.executeAfterTemplateGeneration(pageName, context, result);

    return result;
  }

  // ===============================================
  // MÉTODO PRINCIPAL DE GENERACIÓN
  // ===============================================

  async generate(templateName) {
    // Templates básicos de WordPress (estáticos)
    const basicTemplates = {
      'header': this.generateHeaderTemplate(),
      'footer': this.generateFooterTemplate(),
      '404': this.generateErrorTemplate(),
      'search': this.generateSearchTemplate(),
      'front-page': this.generateFrontPageTemplate(),
      'index': this.generateIndexTemplate()
    };

    // Si es un template básico, retornarlo inmediatamente
    if (basicTemplates[templateName]) {
      return basicTemplates[templateName];
    }

    // Primero verificar si existe un template específico en el directorio
    const specificTemplatePath = path.join(__dirname, `${templateName}.php`);
    if (fs.existsSync(specificTemplatePath)) {
      return fs.readFileSync(specificTemplatePath, 'utf8');
    }

    // Si es un template de página configurado, usar configuración dinámica
    if (this.pageConfig[templateName]) {
      return await this.generatePageTemplate(templateName);
    }

    // Para templates no configurados, usar template básico
    return this.generateBasicTemplate(templateName);
  }
}

module.exports = WpTemplateGenerator;