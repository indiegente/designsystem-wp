const fs = require('fs');
const path = require('path');

/**
 * 🔌 ThemePluginOrchestrator - Core Plugin Management System
 *
 * Orquesta la instalación, configuración y coordinación automática de plugins
 * de WordPress basado en configuración de metadata.json
 */
class ThemePluginOrchestrator {
    constructor(config) {
        this.config = config;
        this.outputDir = config.outputDir;
        this.themeName = config.themeName;

        // Cargar metadata para obtener wordpress_plugins
        this.metadata = this.loadMetadata();
        this.requiredPlugins = this.extractPluginsFromConfig();

        // Plugin registry con información de cada plugin
        // ⚠️ IMPORTANTE: ACF debe ser el primero - otros plugins dependen de él
        this.pluginRegistry = {
            'advanced-custom-fields': {
                slug: 'advanced-custom-fields',
                main_file: 'acf.php',
                type: 'core',
                priority: 1, // Máxima prioridad - instalar PRIMERO
                download_url: 'https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip'
            },
            'headers-security-advanced-hsts-wp': {
                slug: 'headers-security-advanced-hsts-wp',
                main_file: 'headers-security-advanced-hsts-wp.php',
                type: 'security',
                priority: 10,
                download_url: 'https://downloads.wordpress.org/plugin/headers-security-advanced-hsts-wp.latest-stable.zip'
            },
            'wp-rest-cache': {
                slug: 'wp-rest-cache',
                main_file: 'wp-rest-cache.php',
                type: 'performance',
                priority: 20,
                download_url: 'https://downloads.wordpress.org/plugin/wp-rest-cache.latest-stable.zip'
            },
            'seo-by-rank-math': {
                slug: 'seo-by-rank-math',
                main_file: 'rank-math.php',
                type: 'seo',
                priority: 15,
                download_url: 'https://downloads.wordpress.org/plugin/seo-by-rank-math.latest-stable.zip'
            },
            'google-analytics-for-wordpress': {
                slug: 'google-analytics-for-wordpress',
                main_file: 'googleanalytics.php',
                type: 'analytics',
                priority: 25,
                download_url: 'https://downloads.wordpress.org/plugin/google-analytics-for-wordpress.latest-stable.zip'
            },
            'wp-stateless': {
                slug: 'wp-stateless',
                main_file: 'wp-stateless-media.php',
                type: 'cloud_storage',
                priority: 30,
                download_url: 'https://downloads.wordpress.org/plugin/wp-stateless.latest-stable.zip'
            }
        };
    }

    /**
     * Cargar metadata.json
     */
    loadMetadata() {
        const fs = require('fs');
        const path = require('path');

        const metadataPath = path.join(this.config.srcDir, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
            return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        return {};
    }

    /**
     * Extrae plugins requeridos desde configuración
     * ⚠️ ACF siempre se instala - es OBLIGATORIO para el tema
     */
    extractPluginsFromConfig() {
        const plugins = [];
        const wpPlugins = this.metadata.wordpress_plugins || {};

        // ACF es OBLIGATORIO - siempre instalarlo primero
        plugins.push('advanced-custom-fields');

        // Security plugins
        if (wpPlugins.security?.auto_install) {
            plugins.push(wpPlugins.security.plugin);
        }

        // Performance plugins
        if (wpPlugins.performance?.auto_install) {
            plugins.push(wpPlugins.performance.plugin);
        }

        // SEO plugins
        if (wpPlugins.seo?.auto_install) {
            plugins.push(wpPlugins.seo.plugin);
        }

        // Analytics plugins
        if (wpPlugins.analytics?.auto_install) {
            plugins.push(wpPlugins.analytics.plugin);
        }

        // Cloud storage plugins
        if (wpPlugins.cloud_storage?.auto_install) {
            plugins.push(wpPlugins.cloud_storage.plugin);
        }

        return plugins;
    }

    /**
     * Genera código PHP para auto-instalación de plugins
     */
    generatePluginOrchestratorPHP() {
        const themePath = path.join(this.outputDir, this.themeName);
        const includesDir = path.join(themePath, 'includes');

        // Crear directorio includes si no existe
        if (!fs.existsSync(includesDir)) {
            fs.mkdirSync(includesDir, { recursive: true });
        }

        const orchestratorCode = this.generateOrchestratorClass();
        const orchestratorPath = path.join(includesDir, 'class-plugin-orchestrator.php');

        fs.writeFileSync(orchestratorPath, orchestratorCode);
        console.log('✅ Plugin Orchestrator PHP generado');

        return orchestratorPath;
    }

    /**
     * Genera la clase PHP del orquestador
     */
    generateOrchestratorClass() {
        const configCode = this.generatePluginConfigCode();

        return `<?php
/**
 * Plugin Orchestrator - Auto instalación y configuración de plugins
 * Generado automáticamente por Toulouse Design System
 */

if (!defined('ABSPATH')) {
    exit;
}

class ThemePluginOrchestrator {
    private $required_plugins = [];
    private $plugin_configs = [];

    public function __construct() {
        $this->init_required_plugins();
        $this->init_plugin_configs();

        // Hooks principales
        add_action('admin_init', [$this, 'check_and_install_plugins']);
        add_action('init', [$this, 'configure_active_plugins']);
        add_action('admin_notices', [$this, 'show_plugin_status_notices']);
    }

    /**
     * Inicializar lista de plugins requeridos
     */
    private function init_required_plugins() {
        $this->required_plugins = [
${this.generateRequiredPluginsArray()}
        ];
    }

    /**
     * Inicializar configuraciones de plugins
     */
    private function init_plugin_configs() {
        $this->plugin_configs = [
${configCode}
        ];
    }

    /**
     * Verificar e instalar plugins automáticamente
     * Sistema robusto con verificación de instalación antes de activar
     */
    public function check_and_install_plugins() {
        if (!current_user_can('install_plugins')) {
            return;
        }

        foreach ($this->required_plugins as $plugin_data) {
            $plugin_path = $plugin_data['path'];
            $plugin_slug = $plugin_data['slug'];

            // Plugin ya está activo - skip
            if (is_plugin_active($plugin_path)) {
                continue;
            }

            // Plugin NO está instalado - intentar instalarlo
            if (!file_exists(WP_PLUGIN_DIR . '/' . $plugin_slug)) {
                $installed = $this->install_plugin_from_repo($plugin_data);

                // Si la instalación falló, mostrar aviso y NO intentar activar
                if (!$installed) {
                    add_action('admin_notices', function() use ($plugin_data) {
                        echo '<div class="notice notice-error"><p><strong>' . esc_html($plugin_data['name']) . '</strong>: Error al instalar. Verifique permisos de escritura en wp-content/plugins/</p></div>';
                    });
                    continue; // NO intentar activar si falló la instalación
                }
            }

            // Plugin está instalado - intentar activarlo
            if (file_exists(WP_PLUGIN_DIR . '/' . $plugin_path)) {
                $result = activate_plugin($plugin_path);

                if (is_wp_error($result)) {
                    add_action('admin_notices', function() use ($plugin_data, $result) {
                        echo '<div class="notice notice-error"><p><strong>' . esc_html($plugin_data['name']) . '</strong>: Error al activar - ' . esc_html($result->get_error_message()) . '</p></div>';
                    });
                } else {
                    add_action('admin_notices', function() use ($plugin_data) {
                        echo '<div class="notice notice-success"><p><strong>' . esc_html($plugin_data['name']) . '</strong> instalado y activado correctamente ✅</p></div>';
                    });
                }
            }
        }
    }

    /**
     * Instalar plugin desde repositorio de WordPress
     */
    private function install_plugin_from_repo($plugin_data) {
        if (!function_exists('plugins_api')) {
            require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        }

        if (!class_exists('WP_Upgrader')) {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        }

        $api = plugins_api('plugin_information', [
            'slug' => $plugin_data['slug'],
            'fields' => ['short_description' => false, 'sections' => false, 'requires' => false, 'rating' => false, 'ratings' => false, 'downloaded' => false, 'last_updated' => false, 'added' => false, 'tags' => false, 'compatibility' => false, 'homepage' => false, 'donate_link' => false]
        ]);

        if (is_wp_error($api)) {
            error_log('Failed to get plugin info for ' . $plugin_data['slug'] . ': ' . $api->get_error_message());
            return false;
        }

        $upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
        $result = $upgrader->install($api->download_link);

        if (is_wp_error($result)) {
            error_log('Failed to install plugin ' . $plugin_data['slug'] . ': ' . $result->get_error_message());
            return false;
        }

        return true;
    }

    /**
     * Configurar plugins activos según metadata
     */
    public function configure_active_plugins() {
        foreach ($this->plugin_configs as $plugin_slug => $config) {
            $plugin_path = $this->get_plugin_path_by_slug($plugin_slug);

            if (is_plugin_active($plugin_path)) {
                $this->configure_plugin($plugin_slug, $config);
            }
        }
    }

    /**
     * Configurar plugin específico
     */
    private function configure_plugin($plugin_slug, $config) {
        switch ($plugin_slug) {
            case 'headers-security-advanced-hsts-wp':
                $this->configure_security_plugin($config);
                break;

            case 'wp-rest-cache':
                $this->configure_rest_cache_plugin($config);
                break;

            case 'seo-by-rank-math':
                $this->configure_rankmath_plugin($config);
                break;

            case 'google-analytics-for-wordpress':
                $this->configure_monsterinsights_plugin($config);
                break;

            case 'wp-stateless':
                $this->configure_stateless_plugin($config);
                break;
        }
    }

${this.generatePluginConfigurationMethods()}

    /**
     * Obtener path del plugin por slug
     */
    private function get_plugin_path_by_slug($slug) {
        foreach ($this->required_plugins as $plugin_data) {
            if ($plugin_data['slug'] === $slug) {
                return $plugin_data['path'];
            }
        }
        return '';
    }

    /**
     * Mostrar notices de estado de plugins
     */
    public function show_plugin_status_notices() {
        foreach ($this->required_plugins as $plugin_data) {
            if (!is_plugin_active($plugin_data['path'])) {
                echo '<div class="notice notice-warning"><p><strong>Plugin Requerido:</strong> ' . esc_html($plugin_data['name']) . ' necesita ser activado para funcionalidades completas del tema.</p></div>';
            }
        }
    }
}

// Inicializar orquestador
new ThemePluginOrchestrator();
`;
    }

    /**
     * Genera array de plugins requeridos en PHP
     */
    generateRequiredPluginsArray() {
        const pluginEntries = this.requiredPlugins.map(pluginSlug => {
            const plugin = this.pluginRegistry[pluginSlug];
            if (!plugin) return '';

            return `            [
                'slug' => '${plugin.slug}',
                'path' => '${plugin.slug}/${plugin.main_file}',
                'name' => '${this.getPluginDisplayName(plugin.slug)}',
                'type' => '${plugin.type}'
            ]`;
        }).filter(entry => entry).join(',\n');

        return pluginEntries;
    }

    /**
     * Genera código de configuración de plugins
     */
    generatePluginConfigCode() {
        const configEntries = this.requiredPlugins.map(pluginSlug => {
            const config = this.getPluginConfig(pluginSlug);
            if (!config) return '';

            return `            '${pluginSlug}' => ${this.phpArrayFromObject(config)}`;
        }).filter(entry => entry).join(',\n');

        return configEntries;
    }

    /**
     * Genera métodos de configuración específicos para cada plugin
     */
    generatePluginConfigurationMethods() {
        let methods = '';

        if (this.requiredPlugins.includes('headers-security-advanced-hsts-wp')) {
            methods += this.generateSecurityPluginMethod();
        }

        if (this.requiredPlugins.includes('wp-rest-cache')) {
            methods += this.generateRestCacheMethod();
        }

        if (this.requiredPlugins.includes('seo-by-rank-math')) {
            methods += this.generateRankMathMethod();
        }

        if (this.requiredPlugins.includes('google-analytics-for-wordpress')) {
            methods += this.generateMonsterInsightsMethod();
        }

        if (this.requiredPlugins.includes('wp-stateless')) {
            methods += this.generateStatelessMethod();
        }

        return methods;
    }

    /**
     * Método de configuración para Headers Security
     */
    generateSecurityPluginMethod() {
        return `
    /**
     * Configurar Headers Security Advanced plugin
     */
    private function configure_security_plugin($config) {
        // Configuración automática de headers de seguridad
        $security_options = [
            'hsts_enabled' => true,
            'hsts_max_age' => 31536000,
            'csp_enabled' => isset($config['headers']) && in_array('csp', $config['headers']),
            'xss_protection' => isset($config['headers']) && in_array('xss-protection', $config['headers']),
            'frame_options' => 'SAMEORIGIN',
            'referrer_policy' => 'strict-origin-when-cross-origin'
        ];

        // Aplicar configuración según metadata del tema
        if (isset($config['theme_color'])) {
            $security_options['csp_style_src'] = "'self' 'unsafe-inline'";
        }

        update_option('hsts_wp_headers_config', $security_options);

        // Log de configuración aplicada
        error_log('Theme Security Plugin configured automatically');
    }
`;
    }

    /**
     * Método de configuración para WP REST Cache
     */
    generateRestCacheMethod() {
        return `
    /**
     * Configurar WP REST Cache plugin
     */
    private function configure_rest_cache_plugin($config) {
        // Configuración optimizada para APIs del tema
        $cache_options = [
            'cache_duration' => isset($config['cache_duration']) ? $config['cache_duration'] : 3600,
            'cache_methods' => ['GET'],
            'cache_query_params' => true,
            'flush_on_post_save' => true
        ];

        // Endpoints específicos del tema para cache
        $theme_endpoints = [
            '/wp-json/wp/v2/posts',
            '/wp-json/wp/v2/pages',
            '/wp-json/theme/v1/*'
        ];

        update_option('wp_rest_cache_settings', $cache_options);
        update_option('wp_rest_cache_endpoints', $theme_endpoints);

        // Log de configuración aplicada
        error_log('WP REST Cache configured for theme endpoints');
    }
`;
    }

    /**
     * Método de configuración para RankMath SEO
     */
    generateRankMathMethod() {
        return `
    /**
     * Configurar RankMath SEO plugin
     */
    private function configure_rankmath_plugin($config) {
        // Configuración automática de RankMath
        $seo_options = [
            'sitemap_posts' => true,
            'sitemap_pages' => true,
            'breadcrumbs' => isset($config['features']) && in_array('breadcrumbs', $config['features']),
            'rich_snippet' => isset($config['features']) && in_array('rich_snippets', $config['features']),
            'xml_sitemap' => isset($config['features']) && in_array('xml_sitemap', $config['features']),
        ];

        // Configuración de empresa
        if (isset($config['company_name'])) {
            $seo_options['company_name'] = $config['company_name'];
            $seo_options['company_or_person'] = 'company';
        }

        // Color primario del tema
        if (isset($config['primary_color'])) {
            $seo_options['theme_color'] = $config['primary_color'];
        }

        update_option('rank_math_general', $seo_options);

        // Log de configuración aplicada
        error_log('RankMath SEO configured automatically for theme');
    }
`;
    }

    /**
     * Método de configuración para MonsterInsights
     */
    generateMonsterInsightsMethod() {
        return `
    /**
     * Configurar MonsterInsights plugin
     */
    private function configure_monsterinsights_plugin($config) {
        // Configuración automática de MonsterInsights
        $analytics_options = [
            'manual_ua_code_enabled' => true,
            'demographics' => isset($config['features']) && in_array('demographics', $config['features']),
            'enhanced_ecommerce' => isset($config['features']) && in_array('enhanced_ecommerce', $config['features']),
            'events_mode' => isset($config['features']) && in_array('events', $config['features']),
            'anonymize_ips' => isset($config['anonymize_ip']) ? $config['anonymize_ip'] : true,
        ];

        // Código de seguimiento GA4
        if (isset($config['tracking_code'])) {
            $analytics_options['manual_ua_code'] = $config['tracking_code'];
        }

        update_option('monsterinsights_settings', $analytics_options);

        // Log de configuración aplicada
        error_log('MonsterInsights configured automatically for theme');
    }
`;
    }

    /**
     * Método de configuración para WP Stateless
     */
    generateStatelessMethod() {
        return `
    /**
     * Configurar WP Stateless plugin
     */
    private function configure_stateless_plugin($config) {
        // Configuración automática de WP Stateless
        $storage_options = [
            'mode' => isset($config['mode']) ? $config['mode'] : 'cdn',
            'cache_control' => isset($config['cache_control']) ? $config['cache_control'] : 'public, max-age=2592000',
            'custom_domain' => false,
            'delete_remote' => false
        ];

        // Bucket de Google Cloud Storage
        if (isset($config['bucket_name'])) {
            $storage_options['bucket'] = $config['bucket_name'];
        }

        update_option('sm_settings', $storage_options);

        // Log de configuración aplicada
        error_log('WP Stateless configured automatically for theme');
    }
`;
    }

    /**
     * Obtiene configuración específica del plugin desde metadata
     */
    getPluginConfig(pluginSlug) {
        switch (pluginSlug) {
            case 'headers-security-advanced-hsts-wp':
                return this.config.wordpress_plugins?.security?.config || {
                    headers: ['csp', 'hsts', 'xss-protection']
                };

            case 'wp-rest-cache':
                return this.config.wordpress_plugins?.performance?.config || {
                    cache_duration: 3600
                };

            case 'seo-by-rank-math':
                return this.config.wordpress_plugins?.seo?.config || {
                    features: ['rich_snippets', 'xml_sitemap', 'breadcrumbs']
                };

            case 'google-analytics-for-wordpress':
                return this.config.wordpress_plugins?.analytics?.config || {
                    features: ['enhanced_ecommerce', 'demographics', 'events'],
                    anonymize_ip: true
                };

            case 'wp-stateless':
                return this.config.wordpress_plugins?.cloud_storage?.config || {
                    mode: 'cdn',
                    cache_control: 'public, max-age=2592000'
                };

            default:
                return {};
        }
    }

    /**
     * Convierte objeto JavaScript a array PHP
     */
    phpArrayFromObject(obj) {
        const entries = Object.entries(obj).map(([key, value]) => {
            const phpValue = typeof value === 'string' ? `'${value}'` :
                           Array.isArray(value) ? `[${value.map(v => `'${v}'`).join(', ')}]` :
                           value;
            return `'${key}' => ${phpValue}`;
        });

        return `[\n                ${entries.join(',\n                ')}\n            ]`;
    }

    /**
     * Obtiene nombre display del plugin
     */
    getPluginDisplayName(slug) {
        const names = {
            'headers-security-advanced-hsts-wp': 'Headers Security Advanced & HSTS WP',
            'wp-rest-cache': 'WP REST Cache',
            'seo-by-rank-math': 'RankMath SEO',
            'google-analytics-for-wordpress': 'MonsterInsights',
            'wp-stateless': 'WP-Stateless (Google Cloud Storage)'
        };

        return names[slug] || slug;
    }

    /**
     * Genera hook para functions.php
     */
    generateFunctionsHook() {
        return `
// 🔌 Plugin Orchestrator - Auto instalación y configuración
require_once get_template_directory() . '/includes/class-plugin-orchestrator.php';
`;
    }
}

module.exports = ThemePluginOrchestrator;