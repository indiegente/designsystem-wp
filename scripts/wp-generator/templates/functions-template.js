class FunctionsTemplate {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadMetadata();
  }

  loadMetadata() {
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(this.config.srcDir, 'component-metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return {};
  }

  generatePostTypes() {
    if (!this.metadata.postTypes) return '';
    
    return Object.entries(this.metadata.postTypes)
      .map(([postType, config]) => {
        const supports = config.supports ? `array('${config.supports.join("', '")}')` : "array('title', 'editor')";
        const showInRest = config.show_in_rest ? "'show_in_rest' => true," : "";
        
        return `    // ${config.labels.name}
    register_post_type('${postType}', array(
        'labels' => array(
            'name' => '${config.labels.name}',
            'singular_name' => '${config.labels.singular_name}'
        ),
        'public' => ${config.public ? 'true' : 'false'},
        'supports' => ${supports},
        ${showInRest}
    ));`;
      })
      .join('\n    \n');
  }

  generate() {
    return `<?php
/**
 * Functions.php - Generado automáticamente
 */

// Configuración del tema
function toulouse_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    
    register_nav_menus(array(
        'primary' => 'Menú Principal',
        'footer' => 'Menú Footer'
    ));
}
add_action('after_setup_theme', 'toulouse_theme_setup');

// Encolar assets
function toulouse_enqueue_assets() {
    // CSS
    wp_enqueue_style('toulouse-tokens', get_template_directory_uri() . '/assets/css/design-tokens.css');
    wp_enqueue_style('toulouse-style', get_stylesheet_uri());
    
    // JavaScript
    wp_enqueue_script('toulouse-js', get_template_directory_uri() . '/assets/js/index.js', array(), '1.0', true);
}
add_action('wp_enqueue_scripts', 'toulouse_enqueue_assets');

// Auto-incluir todos los componentes
function toulouse_load_components() {
    $components_dir = get_template_directory() . '/components/';
    $components = glob($components_dir . '*/');
    
    foreach ($components as $component_path) {
        $component_name = basename($component_path);
        $php_file = $component_path . $component_name . '.php';
        
        if (file_exists($php_file)) {
            require_once $php_file;
        }
    }
}
add_action('init', 'toulouse_load_components');

// Cargar módulos avanzados
function toulouse_load_advanced_modules() {
    // Cargar sistema de validación y fallbacks
    $validation_file = get_template_directory() . '/inc/validation.php';
    if (file_exists($validation_file)) {
        require_once $validation_file;
    }
    
    // Cargar sistema SEO dinámico
    $seo_file = get_template_directory() . '/inc/seo-manager.php';
    if (file_exists($seo_file)) {
        require_once $seo_file;
    }
    
    // Cargar sistema de assets optimizados
    $assets_file = get_template_directory() . '/inc/asset-enqueue.php';
    if (file_exists($assets_file)) {
        require_once $assets_file;
    }
}
add_action('init', 'toulouse_load_advanced_modules');

// Custom Post Types - Generado desde metadata
function toulouse_register_post_types() {
${this.generatePostTypes()}
}
add_action('init', 'toulouse_register_post_types');

// SEO y Analytics por plantilla
function toulouse_page_seo_analytics() {
    if (!is_page()) return;
    
    $page_template = get_page_template_slug();
    $page_id = get_queried_object_id();
    
    // Configuración de SEO y Analytics por plantilla
    $seo_config = array(
        'page-carreras' => array(
            'title' => 'Carreras Técnicas | Toulouse Lautrec',
            'description' => 'Explora nuestras carreras técnicas y programas especializados en diseño, tecnología y creatividad.',
            'keywords' => 'carreras técnicas, diseño, tecnología, creatividad, Toulouse Lautrec',
            'canonical' => '/carreras',
            'analytics' => array(
                'pageView' => 'page_view_carreras',
                'events' => array(
                    array('name' => 'hero_cta_click', 'category' => 'engagement', 'action' => 'click', 'label' => 'hero_cta_carreras'),
                    array('name' => 'course_card_click', 'category' => 'engagement', 'action' => 'click', 'label' => 'course_card_view')
                )
            )
        ),
        'page-contacto' => array(
            'title' => 'Contacto | Toulouse Lautrec',
            'description' => 'Ponte en contacto con nosotros. Estamos aquí para ayudarte en tu camino creativo.',
            'keywords' => 'contacto, Toulouse Lautrec, información, ayuda',
            'canonical' => '/contacto',
            'analytics' => array(
                'pageView' => 'page_view_contacto',
                'events' => array(
                    array('name' => 'contact_form_submit', 'category' => 'conversion', 'action' => 'submit', 'label' => 'contact_form')
                )
            )
        )
    );
    
    if (isset($seo_config[$page_template])) {
        $config = $seo_config[$page_template];
        
        // Meta tags
        echo '<title>' . esc_html($config['title']) . '</title>';
        echo '<meta name="description" content="' . esc_attr($config['description']) . '">';
        echo '<meta name="keywords" content="' . esc_attr($config['keywords']) . '">';
        
        // Open Graph
        echo '<meta property="og:title" content="' . esc_attr($config['title']) . '">';
        echo '<meta property="og:description" content="' . esc_attr($config['description']) . '">';
        echo '<meta property="og:type" content="website">';
        echo '<meta property="og:url" content="' . esc_url(home_url($config['canonical'])) . '">';
        
        // Canonical
        echo '<link rel="canonical" href="' . esc_url(home_url($config['canonical'])) . '">';
        
        // Analytics - JavaScript code
        echo '<script>';
        echo 'document.addEventListener("DOMContentLoaded", function() {';
        echo '  // Add your analytics tracking code here';
        echo '  // Example: gtag("event", "page_view", { event_category: "engagement" });';
        echo '});';
        echo '</script>';
    }
}
add_action('wp_head', 'toulouse_page_seo_analytics');
?>`;
  }
}

module.exports = FunctionsTemplate;