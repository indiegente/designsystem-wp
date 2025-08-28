class FunctionsTemplate {
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

// Custom Post Types
function toulouse_register_post_types() {
    // Carreras
    register_post_type('carrera', array(
        'labels' => array(
            'name' => 'Carreras',
            'singular_name' => 'Carrera'
        ),
        'public' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt')
    ));
    
    // Cursos
    register_post_type('curso', array(
        'labels' => array(
            'name' => 'Cursos',
            'singular_name' => 'Curso'
        ),
        'public' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt')
    ));
    
    // Testimonios
    register_post_type('testimonio', array(
        'labels' => array(
            'name' => 'Testimonios',
            'singular_name' => 'Testimonio'
        ),
        'public' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'show_in_rest' => true
    ));
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
        echo '<title>' . esc_html($config['title']) . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr($config['description']) . '">' . "\n";
        echo '<meta name="keywords" content="' . esc_attr($config['keywords']) . '">' . "\n";
        
        // Open Graph
        echo '<meta property="og:title" content="' . esc_attr($config['title']) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($config['description']) . '">' . "\n";
        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:url" content="' . esc_url(home_url($config['canonical'])) . '">' . "\n";
        
        // Canonical
        echo '<link rel="canonical" href="' . esc_url(home_url($config['canonical'])) . '">' . "\n";
        
        // Analytics
        echo '<script>' . "\n";
        echo '// Page View: ' . $config['analytics']['pageView'] . "\n";
        echo '// gtag(\'config\', \'GA_MEASUREMENT_ID\', {' . "\n";
        echo '//   \'page_title\': \'' . $config['analytics']['pageView'] . '\',' . "\n";
        echo '//   \'page_location\': window.location.href' . "\n";
        echo '// });' . "\n";
        
        foreach ($config['analytics']['events'] as $event) {
            echo '// ' . $event['name'] . "\n";
            echo 'document.addEventListener(\'DOMContentLoaded\', function() {' . "\n";
            echo '  // Implementar tracking para ' . $event['name'] . "\n";
            echo '  // gtag(\'event\', \'' . $event['action'] . '\', {' . "\n";
            echo '  //   \'event_category\': \'' . $event['category'] . '\',' . "\n";
            echo '  //   \'event_label\': \'' . $event['label'] . '\'' . "\n";
            echo '  // });' . "\n";
            echo '});' . "\n";
        }
        echo '</script>' . "\n";
    }
}
add_action('wp_head', 'toulouse_page_seo_analytics');
?>`;
  }
}

module.exports = FunctionsTemplate;