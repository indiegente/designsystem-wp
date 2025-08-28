const fs = require('fs');
const path = require('path');
const ComponentGenerator = require('../component-generator');

class DynamicPageTemplates {
  constructor(config) {
    this.config = config;
    this.pageConfig = this.loadPageConfig();
    this.componentGenerator = new ComponentGenerator(config);
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

  generateTemplateName(templateName) {
    return templateName
      .replace('page-', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

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
    document.addEventListener('DOMContentLoaded', function() {
      // Implementar tracking para ${event.name}
      // gtag('event', '${event.action}', {
      //   'event_category': '${event.category}',
      //   'event_label': '${event.label}'
      // });
    });`).join('');
    
    return `
    <!-- Analytics -->
    <script>
    // Page View: ${analytics.pageView}
    // gtag('config', 'GA_MEASUREMENT_ID', {
    //   'page_title': '${analytics.pageView}',
    //   'page_location': window.location.href
    // });
    ${eventCode}
    </script>`;
  }

  generateComponentInclude(component) {
    const componentName = component.name.replace('-', '_');
    return `require_once get_template_directory() . '/components/${component.name}/${component.name}.php';`;
  }

  async generateComponentRender(component, index) {
    // Usar el nuevo generador basado en metadata con soporte para extensiones
    return await this.componentGenerator.generateComponentCode(component, component.dataSource);
  }



  async generatePageTemplate(pageName) {
    const pageConfig = this.pageConfig[pageName];
    
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

// Renderizar componentes
${componentRendersString}
?>

<main class="${pageName}-content">
    <?php
    // Loop de WordPress - buenas prácticas
    if (have_posts()) :
        while (have_posts()) : the_post();
            the_content();
        endwhile;
    endif;
    ?>
</main>

<?php get_footer(); ?>`;

    // Ejecutar hooks después de la generación del template
    result = await this.componentGenerator.extensionManager.executeAfterTemplateGeneration(pageName, context, result);

    return result;
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

  async generate(templateName) {
    // Si es un template de página configurado, usar configuración dinámica
    if (this.pageConfig[templateName]) {
      return await this.generatePageTemplate(templateName);
    }

    // Fallback a template básico
    return this.generateBasicTemplate(templateName);
  }
}

module.exports = DynamicPageTemplates;
