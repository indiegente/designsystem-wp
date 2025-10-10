class FunctionsTemplate {
  constructor(config) {
    this.config = config;

    // 🎯 SINGLE SOURCE OF TRUTH: Usar ConfigSingleton
    const ConfigSingleton = require('../core/config-singleton');
    const configSingleton = ConfigSingleton.getInstance();

    this.metadata = configSingleton.getMetadata();
    this.pageTemplates = configSingleton.getPageTemplates();

    // Extraer configuraciones dinámicas
    this.functionPrefix = config.phpFunctionPrefix || 'theme';
    this.enqueueHandle = config.themeName || 'theme';
    this.themeDisplayName = config.themeDisplayName || 'Generated Theme';
    this.assetPaths = config.assetPaths || { css: 'assets/css', js: 'assets/js' };
  }

  // Método obsoleto - usar ConfigSingleton
  loadMetadata() {
    // Mantenido para compatibilidad, pero ya no se usa
    return {};
  }

  loadSeoConfig() {
    const fs = require('fs');
    const path = require('path');
    const seoConfigPath = path.join(this.config.srcDir, 'seo-config.json');

    if (fs.existsSync(seoConfigPath)) {
      return JSON.parse(fs.readFileSync(seoConfigPath, 'utf8'));
    }
    return {};
  }

  loadAnalyticsConfig() {
    const fs = require('fs');
    const path = require('path');
    const analyticsConfigPath = path.join(this.config.srcDir, 'analytics-config.json');

    if (fs.existsSync(analyticsConfigPath)) {
      return JSON.parse(fs.readFileSync(analyticsConfigPath, 'utf8'));
    }
    return {};
  }

  generateSeoConfig() {
    const seoConfig = this.loadSeoConfig();

    if (Object.keys(seoConfig).length === 0) {
      return "array(); // No SEO config found";
    }

    const configEntries = [];

    Object.entries(seoConfig).forEach(([pageKey, pageConfig]) => {
      if (pageKey === 'default') return; // Skip default config

      const entry = `        '${pageKey}' => array(
            'title' => '${pageConfig.title || ''}',
            'description' => '${pageConfig.description || ''}',
            'keywords' => '${pageConfig.keywords || ''}',
            'canonical' => '${pageConfig.canonical || ''}',
            'ogType' => '${pageConfig.ogType || 'website'}',
            'ogImage' => '${pageConfig.ogImage || ''}',
            'twitterCard' => '${pageConfig.twitterCard || 'summary'}'
        )`;

      configEntries.push(entry);
    });

    return `array(
${configEntries.join(',\n')}
    )`;
  }

  generateAnalyticsConfig() {
    const analyticsConfig = this.loadAnalyticsConfig();

    if (Object.keys(analyticsConfig).length === 0 || !analyticsConfig.page_templates) {
      return "array(); // No Analytics config found";
    }

    const configEntries = [];

    Object.entries(analyticsConfig.page_templates).forEach(([pageKey, pageConfig]) => {
      const eventsArray = pageConfig.events ? pageConfig.events.map(event =>
        `array('name' => '${event.name}', 'category' => '${event.category}', 'action' => '${event.action}', 'label' => '${event.label}')`
      ).join(', ') : '';

      const entry = `        '${pageKey}' => array(
            'pageView' => '${pageConfig.page_view || ''}',
            'events' => array(${eventsArray})
        )`;

      configEntries.push(entry);
    });

    return `array(
${configEntries.join(',\n')}
    )`;
  }

  generatePostTypes() {
    if (!this.pageTemplates.postTypes) return '';

    return Object.entries(this.pageTemplates.postTypes)
      .map(([postType, config]) => {
        const supports = config.supports ? `array('${config.supports.join("', '")}')` : "array('title', 'editor')";
        const showInRest = config.show_in_rest ? "'show_in_rest' => true," : "";
        const menuIcon = config.menu_icon || 'dashicons-admin-post';

        return `    // ${config.labels.name}
    register_post_type('${postType}', array(
        'labels' => array(
            'name' => '${config.labels.name}',
            'singular_name' => '${config.labels.singular_name}',
            'menu_name' => '${config.labels.name}',
            'add_new' => 'Agregar Nuevo',
            'add_new_item' => 'Agregar Nuevo ${config.labels.singular_name}',
            'edit_item' => 'Editar ${config.labels.singular_name}',
            'new_item' => 'Nuevo ${config.labels.singular_name}',
            'view_item' => 'Ver ${config.labels.singular_name}',
            'search_items' => 'Buscar ${config.labels.name}',
            'not_found' => 'No se encontraron ${config.labels.name.toLowerCase()}',
            'not_found_in_trash' => 'No se encontraron ${config.labels.name.toLowerCase()} en la papelera',
            'all_items' => 'Todos los ${config.labels.name}',
            'archives' => 'Archivos de ${config.labels.name}',
            'insert_into_item' => 'Insertar en ${config.labels.singular_name.toLowerCase()}',
            'uploaded_to_this_item' => 'Subido a este ${config.labels.singular_name.toLowerCase()}',
            'filter_items_list' => 'Filtrar lista de ${config.labels.name.toLowerCase()}',
            'items_list_navigation' => 'Navegación de lista de ${config.labels.name.toLowerCase()}',
            'items_list' => 'Lista de ${config.labels.name.toLowerCase()}'
        ),
        'public' => ${config.public ? 'true' : 'false'},
        'menu_position' => 20,
        'menu_icon' => '${menuIcon}',
        'has_archive' => true,
        'supports' => ${supports},
        'capability_type' => 'post',
        'map_meta_cap' => true,
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

    // ✅ GUTENBERG SUPPORT: Enable block editor features
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_theme_support('responsive-embeds');

    register_nav_menus(array(
        'primary' => __('Menú Principal', '${this.enqueueHandle}'),
        'footer' => __('Menú Footer', '${this.enqueueHandle}')
    ));
}
add_action('after_setup_theme', '${this.functionPrefix}_theme_setup');

// Assets manejados por inc/asset-enqueue.php (usa enqueue_order del manifest)
// Para evitar duplicados, esta función está deshabilitada

// Auto-incluir todos los componentes
function ${this.functionPrefix}_load_components() {
    $components_dir = get_template_directory() . '/components/';
    $components = glob($components_dir . '*/');
    
    foreach ($components as $component_path) {
        $component_name = basename($component_path);
        $php_file = $component_path . $component_name . '.php';
        
        if (file_exists($php_file)) {
            get_template_part('components/' . $component_name . '/' . $component_name);
        }
    }
}
add_action('init', '${this.functionPrefix}_load_components');

// Cargar módulos avanzados
function ${this.functionPrefix}_load_advanced_modules() {
    
    // Cargar sistema SEO integrado con ACF editable (ya incluido en seo-editable-fields.php)
    // El SEO manager ahora está integrado en el sistema de campos editables
    
    // Cargar sistema Analytics separado
    $analytics_file = get_template_directory() . '/inc/analytics-manager.php';
    if (file_exists($analytics_file)) {
        require_once $analytics_file;
    }

    // Cargar campos ACF generados automáticamente
    $acf_file = get_template_directory() . '/inc/acf-fields.php';
    if (file_exists($acf_file)) {
        require_once $acf_file;
    }

    // Cargar campos SEO editables para el equipo SEO
    $seo_editable_file = get_template_directory() . '/inc/seo-editable-fields.php';
    if (file_exists($seo_editable_file)) {
        require_once $seo_editable_file;
    }

    // Cargar sistema de assets optimizados (usa enqueue_order del manifest)
    $assets_file = get_template_directory() . '/inc/asset-enqueue.php';
    if (file_exists($assets_file)) {
        require_once $assets_file;
    }

    // 🔌 Plugin Orchestrator - Auto instalación y configuración
    $plugin_orchestrator_file = get_template_directory() . '/includes/class-plugin-orchestrator.php';
    if (file_exists($plugin_orchestrator_file)) {
        require_once $plugin_orchestrator_file;
    }

    // 🧩 Gutenberg Blocks - Componentes Lit como bloques
    $gutenberg_blocks_file = get_template_directory() . '/blocks/index.php';
    if (file_exists($gutenberg_blocks_file)) {
        require_once $gutenberg_blocks_file;
    }
}
add_action('init', '${this.functionPrefix}_load_advanced_modules');

// Custom Post Types - Generado desde metadata
function ${this.functionPrefix}_register_post_types() {
${this.generatePostTypes()}
}
add_action('init', '${this.functionPrefix}_register_post_types');

// SEO por plantilla (generado desde seo-config.json)
function ${this.functionPrefix}_page_seo() {
    if (!is_page()) return;

    $page_template = get_page_template_slug();

    // Configuración de SEO generada desde seo-config.json
    $seo_config = ${this.generateSeoConfig()};

    if (isset($seo_config[$page_template])) {
        $config = $seo_config[$page_template];

        // Meta tags
        echo '<title>' . esc_html($config['title']) . '</title>';
        echo '<meta name="description" content="' . esc_attr($config['description']) . '">';
        echo '<meta name="keywords" content="' . esc_attr($config['keywords']) . '">';

        // Open Graph
        echo '<meta property="og:title" content="' . esc_attr($config['title']) . '">';
        echo '<meta property="og:description" content="' . esc_attr($config['description']) . '">';
        echo '<meta property="og:type" content="' . esc_attr($config['ogType']) . '">';
        echo '<meta property="og:url" content="' . esc_url(home_url($config['canonical'])) . '">';

        if (!empty($config['ogImage'])) {
            echo '<meta property="og:image" content="' . esc_url($config['ogImage']) . '">';
        }

        // Twitter Card
        echo '<meta name="twitter:card" content="' . esc_attr($config['twitterCard']) . '">';

        // Canonical
        echo '<link rel="canonical" href="' . esc_url(home_url($config['canonical'])) . '">';
    }
}
add_action('wp_head', '${this.functionPrefix}_page_seo');

// Analytics modular (generado desde analytics-config.json)
function ${this.functionPrefix}_page_analytics() {
    if (!is_page()) return;

    $page_template = get_page_template_slug();

    // Configuración de Analytics generada desde analytics-config.json
    $analytics_config = ${this.generateAnalyticsConfig()};

    if (isset($analytics_config[$page_template])) {
        $config = $analytics_config[$page_template];

        // Data Layer básico - Enfoque modular
        $nonce = wp_create_nonce('${this.functionPrefix}_analytics_nonce');
        wp_add_inline_script('${this.enqueueHandle}-${this.enqueueHandle}-ds-umd', '
            // Data Layer modular - Compatible con plugins, GTM y nativo
            window.dataLayer = window.dataLayer || [];

            // Page view event
            dataLayer.push({
                "event": "' . esc_js($config['pageView']) . '",
                "page_template": "' . esc_js($page_template) . '",
                "theme_version": "1.0.0",
                "nonce": "' . esc_js($nonce) . '"
            });

            // Custom events setup (compatible con GTM/plugins)
            document.addEventListener("DOMContentLoaded", function() {
                // Analytics events disponibles para extensiones
                if (typeof ${this.functionPrefix}_analytics_ready === "function") {
                    ${this.functionPrefix}_analytics_ready();
                }
            });
        ');
    }
}
add_action('wp_head', '${this.functionPrefix}_page_analytics');
?>`;
  }
}

module.exports = FunctionsTemplate;