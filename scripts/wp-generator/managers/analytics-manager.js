const fs = require('fs');
const path = require('path');

/**
 * Analytics Manager - Gestión de tracking y medición
 * 
 * Genera código de GA4, eventos personalizados y data layer
 * con sistema de extensiones para diferentes plataformas.
 */
class AnalyticsManager {
  constructor(config) {
    this.config = config;
    this.analyticsConfig = this.loadAnalyticsConfig();
    this.extensions = this.loadExtensions();
  }

  /**
   * Carga configuración de analytics desde src/analytics-config.json
   */
  loadAnalyticsConfig() {
    const configPath = path.join(this.config.srcDir, 'analytics-config.json');
    
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return configData.analytics || {};
    }
    
    return this.config.analytics || {
      enabled: false,
      googleAnalytics: { enabled: false },
      customEvents: { pageViews: false, componentViews: false }
    };
  }

  /**
   * Carga extensiones de analytics disponibles
   */
  loadExtensions() {
    const extensionsDir = path.join(__dirname, '../extensions/analytics');
    const extensions = {};
    
    if (fs.existsSync(extensionsDir)) {
      const files = fs.readdirSync(extensionsDir);
      
      files.forEach(file => {
        if (file.endsWith('.js')) {
          try {
            const extensionName = path.basename(file, '.js');
            const ExtensionClass = require(path.join(extensionsDir, file));
            extensions[extensionName] = new ExtensionClass(this.config);
          } catch (error) {
            console.warn(`⚠️ Error cargando extensión de analytics ${file}:`, error.message);
          }
        }
      });
    }
    
    return extensions;
  }

  /**
   * Genera archivo PHP de analytics para WordPress
   */
  generateAnalyticsFile() {
    // 1. Generar archivo de configuración JSON
    this.generateAnalyticsConfigFile();
    
    // 2. Generar archivo PHP
    const analyticsContent = this.generateAnalyticsPhp();
    
    const outputPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'inc',
      'analytics-manager.php'
    );
    
    fs.writeFileSync(outputPath, analyticsContent);
    console.log('✅ Analytics Manager generado');
  }

  /**
   * Genera archivo analytics-config.json para que PHP lo lea
   */
  generateAnalyticsConfigFile() {
    // DEBUG: Mostrar qué configuración estamos recibiendo
    console.log('🔍 DEBUG Analytics Config:', JSON.stringify(this.analyticsConfig, null, 2));
    
    if (!this.analyticsConfig.enabled) {
      throw new Error('❌ ANALYTICS DESHABILITADO: config.js → analytics.enabled debe ser true\n💡 Ubicación: scripts/wp-generator/core/config.js línea 78\n💡 Configuración recibida: ' + JSON.stringify(this.analyticsConfig));
    }

    if (!this.analyticsConfig.googleAnalytics?.measurementId || this.analyticsConfig.googleAnalytics.measurementId === 'G-XXXXXXXXXX') {
      throw new Error('❌ GA4 ID FALTANTE: Configurar measurementId real en config.js\n💡 Ubicación: scripts/wp-generator/core/config.js línea 81\n💡 Cambiar: G-XXXXXXXXXX por tu GA4 ID real');
    }

    const configData = {
      analytics: this.analyticsConfig
    };

    const configPath = path.join(
      this.config.outputDir,
      this.config.themeName,
      'assets',
      'analytics-config.json'
    );

    // Crear directorio assets si no existe
    const assetsDir = path.dirname(configPath);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log('✅ Archivo analytics-config.json generado');
  }

  /**
   * Genera el código PHP completo de analytics
   */
  generateAnalyticsPhp() {
    return `<?php
/**
 * Analytics Manager - Generado automáticamente
 * Gestión de GA4, eventos personalizados y data layer
 */

class ToulouseAnalyticsManager {
    private $analytics_config;
    private $current_template;
    private $current_components;
    
    public function __construct() {
        $this->loadAnalyticsConfig();
        $this->current_template = $this->getCurrentTemplateSlug();
        $this->current_components = $this->getCurrentComponents();
    }
    
    /**
     * Carga configuración de analytics desde analytics-config.json
     */
    private function loadAnalyticsConfig() {
        // Cargar desde archivo de configuración generado
        $config_file = get_template_directory() . '/assets/analytics-config.json';
        
        if (file_exists($config_file)) {
            $config_content = file_get_contents($config_file);
            $config_data = json_decode($config_content, true);
            
            if ($config_data && isset($config_data['analytics'])) {
                $analytics = $config_data['analytics'];
                $this->analytics_config = array(
                    'enabled' => $analytics['enabled'] ?? true,
                    'ga4_measurement_id' => $analytics['googleAnalytics']['measurementId'] ?? '',
                    'ga4_enabled' => $analytics['googleAnalytics']['enabled'] ?? true,
                    'custom_events' => array(
                        'page_views' => $analytics['customEvents']['pageViews'] ?? true,
                        'component_views' => $analytics['customEvents']['componentViews'] ?? true,
                        'interactions' => $analytics['customEvents']['interactions'] ?? true
                    )
                );
                return;
            }
        }
        
        // FAIL FAST - No fallback si no hay configuración
        error_log('Analytics Manager: No se encontró analytics-config.json');
        $this->analytics_config = array(
            'enabled' => false,
            'ga4_measurement_id' => '',
            'ga4_enabled' => false,
            'custom_events' => array(
                'page_views' => false,
                'component_views' => false,
                'interactions' => false
            )
        );
    }
    
    /**
     * Obtiene el slug del template actual
     */
    private function getCurrentTemplateSlug() {
        global $template;
        
        if ($template) {
            return basename($template, '.php');
        }
        
        return get_page_template_slug() ? basename(get_page_template_slug(), '.php') : '';
    }
    
    /**
     * Detecta componentes en la página actual
     */
    private function getCurrentComponents() {
        $components = array();
        $content = get_the_content();
        
        // Detectar componentes dinámicamente
        if (strpos($content, 'hero-section') !== false) $components[] = 'hero-section';
        if (strpos($content, 'course-card') !== false) $components[] = 'course-card';
        if (strpos($content, 'testimonials') !== false) $components[] = 'testimonials';
        if (strpos($content, 'feature-grid') !== false) $components[] = 'feature-grid';
        if (strpos($content, 'interactive-gallery') !== false) $components[] = 'interactive-gallery';
        
        return $components;
    }
    
    /**
     * Genera script de GA4 básico
     */
    public function generateGA4Script() {
        if (!$this->analytics_config['ga4_enabled'] || empty($this->analytics_config['ga4_measurement_id'])) {
            return '';
        }
        
        $measurement_id = esc_attr($this->analytics_config['ga4_measurement_id']);
        
        return '
        <!-- Google Analytics 4 -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=' . $measurement_id . '"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag("js", new Date());
            gtag("config", "' . $measurement_id . '");
        </script>';
    }
    
    /**
     * Genera eventos personalizados
     */
    public function generateCustomEvents() {
        if (!$this->analytics_config['enabled']) {
            return '';
        }
        
        $events = array();
        
        // Eventos por template
        if ($this->analytics_config['custom_events']['page_views']) {
            $events[] = array(
                'event' => 'page_view',
                'category' => 'engagement',
                'template' => $this->current_template,
                'page_title' => get_the_title()
            );
        }
        
        // Eventos por componentes
        if ($this->analytics_config['custom_events']['component_views']) {
            foreach ($this->current_components as $component) {
                $events[] = array(
                    'event' => 'component_view',
                    'category' => 'engagement', 
                    'component' => $component,
                    'template' => $this->current_template
                );
            }
        }
        
        if (empty($events)) {
            return '';
        }
        
        $script = '<script type="text/javascript" id="toulouse-analytics-events">';
        $script .= 'document.addEventListener("DOMContentLoaded", function() {';
        
        foreach ($events as $event) {
            // Console log para debugging
            $script .= 'console.log("Analytics Event:", ' . json_encode($event) . ');';
            
            // GA4 tracking
            if ($this->analytics_config['ga4_enabled']) {
                $script .= 'if (typeof gtag !== "undefined") {';
                $script .= 'gtag("event", "' . esc_js($event['event']) . '", {';
                $script .= '"event_category": "' . esc_js($event['category']) . '",';
                
                if (isset($event['template'])) {
                    $script .= '"template": "' . esc_js($event['template']) . '",';
                }
                if (isset($event['component'])) {
                    $script .= '"component": "' . esc_js($event['component']) . '",';
                }
                if (isset($event['page_title'])) {
                    $script .= '"page_title": "' . esc_js($event['page_title']) . '",';
                }
                
                $script .= '"custom_parameter": "toulouse_design_system"';
                $script .= '});';
                $script .= '}';
            }
        }
        
        $script .= '});';
        $script .= '</script>';
        
        return $script;
    }
    
    /**
     * Genera data layer para extensiones
     */
    public function generateDataLayer() {
        $dataLayer = array(
            'page_type' => $this->current_template,
            'components' => $this->current_components,
            'timestamp' => current_time('timestamp'),
            'user_type' => is_user_logged_in() ? 'logged_in' : 'anonymous'
        );
        
        // Agregar datos específicos del post si existe
        if (get_the_ID()) {
            $dataLayer['post_id'] = get_the_ID();
            $dataLayer['post_type'] = get_post_type();
            $dataLayer['post_title'] = get_the_title();
        }
        
        return '<script>
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(' . json_encode($dataLayer) . ');
        </script>';
    }
}

// Inicializar Analytics Manager lazy
function get_toulouse_analytics() {
    static $toulouse_analytics = null;
    
    if ($toulouse_analytics === null) {
        try {
            $toulouse_analytics = new ToulouseAnalyticsManager();
        } catch (Exception $e) {
            error_log('Error inicializando ToulouseAnalyticsManager: ' . $e->getMessage());
            $toulouse_analytics = false;
        } catch (Error $e) {
            error_log('Error fatal en ToulouseAnalyticsManager: ' . $e->getMessage());
            $toulouse_analytics = false;
        }
    }
    
    return $toulouse_analytics;
}

// Hook para GA4 en wp_head
function toulouse_analytics_ga4() {
    $toulouse_analytics = get_toulouse_analytics();
    if ($toulouse_analytics && method_exists($toulouse_analytics, 'generateGA4Script')) {
        echo $toulouse_analytics->generateGA4Script();
    }
}
add_action('wp_head', 'toulouse_analytics_ga4');

// Hook para data layer en wp_head
function toulouse_analytics_data_layer() {
    $toulouse_analytics = get_toulouse_analytics();
    if ($toulouse_analytics && method_exists($toulouse_analytics, 'generateDataLayer')) {
        echo $toulouse_analytics->generateDataLayer();
    }
}
add_action('wp_head', 'toulouse_analytics_data_layer');

// Hook para eventos personalizados en wp_footer
function toulouse_analytics_events() {
    $toulouse_analytics = get_toulouse_analytics();
    if ($toulouse_analytics && method_exists($toulouse_analytics, 'generateCustomEvents')) {
        echo $toulouse_analytics->generateCustomEvents();
    }
}
add_action('wp_footer', 'toulouse_analytics_events');
?>`;
  }
}

module.exports = AnalyticsManager;