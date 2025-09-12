class FunctionsTemplate {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadMetadata();
    
    // Extraer configuraciones dinámicas
    this.functionPrefix = config.phpFunctionPrefix || 'theme';
    this.enqueueHandle = config.themeName || 'theme';
    this.themeDisplayName = config.themeDisplayName || 'Generated Theme';
    this.assetPaths = config.assetPaths || { css: 'assets/css', js: 'assets/js' };
  }

  loadMetadata() {
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    
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
 * Functions.php - Generado automáticamente desde ${this.themeDisplayName}
 */

// Configuración del tema
function ${this.functionPrefix}_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    
    register_nav_menus(array(
        'primary' => 'Menú Principal',
        'footer' => 'Menú Footer'
    ));
}
add_action('after_setup_theme', '${this.functionPrefix}_theme_setup');

// Encolar assets (basado en disponibilidad)
function ${this.functionPrefix}_enqueue_assets() {
    // Leer manifest de assets disponibles
    $manifest_file = get_template_directory() . '/assets/available-assets.json';
    $assets_available = array();
    
    if (file_exists($manifest_file)) {
        $manifest_content = file_get_contents($manifest_file);
        $assets_available = json_decode($manifest_content, true);
    }
    
    // CSS - Encolar usando nombres reales del manifest con preload
    if (isset($assets_available['css'])) {
        foreach ($assets_available['css'] as $asset_key => $filename) {
            if ($asset_key === 'design-tokens') {
                wp_enqueue_style('${this.enqueueHandle}-tokens', get_template_directory_uri() . '/${this.assetPaths.css}/' . $filename);
                // Preload design tokens como critical CSS
                echo '<link rel="preload" href="' . esc_url(get_template_directory_uri() . '/${this.assetPaths.css}/' . $filename) . '" as="style" onload="var self=this;self.onload=null;self.rel=\\'stylesheet\\'">';
            } elseif (strpos($asset_key, '${this.enqueueHandle}') === 0) {
                wp_enqueue_style('${this.enqueueHandle}-main', get_template_directory_uri() . '/${this.assetPaths.css}/' . $filename);
                // Preload main CSS como critical
                echo '<link rel="preload" href="' . esc_url(get_template_directory_uri() . '/${this.assetPaths.css}/' . $filename) . '" as="style" onload="var self=this;self.onload=null;self.rel=\\'stylesheet\\'">';
            }
        }
    }
    
    wp_enqueue_style('${this.enqueueHandle}-style', get_stylesheet_uri());
    
    // JavaScript - Encolar solo UNA versión para evitar conflictos
    if (isset($assets_available['js'])) {
        $js_loaded = false;
        
        // Preferir ES6 sobre UMD para mejor compatibilidad con módulos
        foreach ($assets_available['js'] as $asset_key => $filename) {
            if ((strpos($asset_key, '${this.enqueueHandle.split('-')[0]}-ds') === 0 || $asset_key === 'main') && !$js_loaded) {
                // Preferir versión ES6
                if (strpos($filename, '.es.js') !== false) {
                    $js_path = $filename;
                    $handle = '${this.enqueueHandle}-js-main';
                    wp_enqueue_script($handle, get_template_directory_uri() . '/assets/' . $js_path, array(), '1.0', true);
                    
                    // Añadir atributo type="module" para ES6
                    add_filter('script_loader_tag', function($tag, $handle_filter, $src) use ($handle) {
                        if ($handle_filter === $handle) {
                            return str_replace('<script type="text/javascript"', '<script type="module"', $tag);
                        }
                        return $tag;
                    }, 10, 3);
                    
                    $js_loaded = true;
                }
            }
        }
        
        // Si no encontró ES6, cargar UMD como fallback
        if (!$js_loaded) {
            foreach ($assets_available['js'] as $asset_key => $filename) {
                if ((strpos($asset_key, '${this.enqueueHandle.split('-')[0]}-ds') === 0 || $asset_key === 'main') && !$js_loaded) {
                    if (strpos($filename, '.umd.js') !== false) {
                        $js_path = $filename;
                        $handle = '${this.enqueueHandle}-js-main';
                        wp_enqueue_script($handle, get_template_directory_uri() . '/assets/' . $js_path, array(), '1.0', true);
                        $js_loaded = true;
                    }
                }
            }
        }
    }
    
    // Debug info (solo para desarrollo)
    if (defined('WP_DEBUG') && WP_DEBUG) {
        $build_success = isset($assets_available['buildSuccess']) ? $assets_available['buildSuccess'] : false;
        if (!$build_success) {
            echo '<!-- ${this.themeDisplayName}: Assets optimizados no disponibles. Usando estilos inline. -->';
        }
    }
}
add_action('wp_enqueue_scripts', '${this.functionPrefix}_enqueue_assets');

// Auto-incluir todos los componentes
function ${this.functionPrefix}_load_components() {
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
add_action('init', '${this.functionPrefix}_load_components');

// Cargar módulos avanzados
function ${this.functionPrefix}_load_advanced_modules() {
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
    
    // Cargar sistema Analytics separado
    $analytics_file = get_template_directory() . '/inc/analytics-manager.php';
    if (file_exists($analytics_file)) {
        require_once $analytics_file;
    }
    
    // Cargar sistema de assets optimizados - DESHABILITADO para evitar duplicados
    // El enqueue de assets se maneja directamente en functions.php
    // $assets_file = get_template_directory() . '/inc/asset-enqueue.php';
    // if (file_exists($assets_file)) {
    //     require_once $assets_file;
    // }
}
add_action('init', '${this.functionPrefix}_load_advanced_modules');

// Custom Post Types - Generado desde metadata
function ${this.functionPrefix}_register_post_types() {
${this.generatePostTypes()}
}
add_action('init', '${this.functionPrefix}_register_post_types');

// SEO y Analytics por plantilla
function ${this.functionPrefix}_page_seo_analytics() {
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
add_action('wp_head', '${this.functionPrefix}_page_seo_analytics');
?>`;
  }
}

module.exports = FunctionsTemplate;