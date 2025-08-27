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
}
add_action('init', 'toulouse_register_post_types');
?>`;
  }
}

module.exports = FunctionsTemplate;