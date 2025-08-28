const fs = require('fs');
const path = require('path');

/**
 * SEOManager - Gestión avanzada de SEO dinámico
 * 
 * Genera meta tags, OpenGraph, JSON-LD y otras optimizaciones SEO
 * basadas en la configuración de componentes y templates.
 */
class SEOManager {
  constructor(config) {
    this.config = config;
    this.seoConfig = this.loadSEOConfig();
  }

  /**
   * Carga configuración de SEO desde archivo JSON
   */
  loadSEOConfig() {
    const configPath = path.join(this.config.srcDir, 'seo-config.json');
    
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Configuración por defecto
    return {
      default: {
        title: 'Toulouse Lautrec - Design System',
        description: 'Sistema de diseño modular basado en componentes Lit',
        keywords: 'diseño, componentes, wordpress, lit',
        author: 'Toulouse Lautrec',
        ogType: 'website',
        twitterCard: 'summary_large_image'
      },
      templates: {
        'page-carreras': {
          title: 'Carreras Técnicas | Toulouse Lautrec',
          description: 'Explora nuestras carreras técnicas y programas especializados en diseño, tecnología y creatividad.',
          keywords: 'carreras técnicas, diseño, tecnología, creatividad, Toulouse Lautrec',
          ogType: 'website',
          schema: {
            type: 'Course',
            provider: {
              type: 'Organization',
              name: 'Toulouse Lautrec'
            }
          }
        },
        'page-contacto': {
          title: 'Contacto | Toulouse Lautrec',
          description: 'Ponte en contacto con nosotros. Estamos aquí para ayudarte en tu camino creativo.',
          keywords: 'contacto, Toulouse Lautrec, información, ayuda',
          ogType: 'website',
          schema: {
            type: 'ContactPage',
            contactPoint: {
              type: 'ContactPoint',
              contactType: 'customer service'
            }
          }
        }
      },
      components: {
        'hero-section': {
          schema: {
            type: 'WebPage',
            mainEntity: {
              type: 'CreativeWork'
            }
          }
        },
        'course-card': {
          schema: {
            type: 'Course',
            provider: {
              type: 'Organization',
              name: 'Toulouse Lautrec'
            }
          }
        },
        'testimonials': {
          schema: {
            type: 'Review',
            itemReviewed: {
              type: 'Organization',
              name: 'Toulouse Lautrec'
            }
          }
        }
      }
    };
  }

  /**
   * Genera código PHP para SEO dinámico
   */
  generateSEOCode() {
    return `<?php
/**
 * SEO Manager - Generado automáticamente
 * Gestión dinámica de SEO, OpenGraph y JSON-LD
 */

class ToulouseSEOManager {
    private $seo_config;
    private $current_template;
    private $current_components;
    
    public function __construct() {
        $this->loadSEOConfig();
        $this->current_template = get_page_template_slug();
        $this->current_components = $this->getCurrentComponents();
    }
    
    /**
     * Carga configuración de SEO
     */
    private function loadSEOConfig() {
        $config_path = get_template_directory() . '/assets/seo-config.json';
        if (file_exists($config_path)) {
            $this->seo_config = json_decode(file_get_contents($config_path), true);
        } else {
            $this->seo_config = $this->getDefaultSEOConfig();
        }
    }
    
    /**
     * Configuración SEO por defecto
     */
    private function getDefaultSEOConfig() {
        return array(
            'default' => array(
                'title' => 'Toulouse Lautrec - Design System',
                'description' => 'Sistema de diseño modular basado en componentes Lit',
                'keywords' => 'diseño, componentes, wordpress, lit',
                'author' => 'Toulouse Lautrec',
                'ogType' => 'website',
                'twitterCard' => 'summary_large_image'
            )
        );
    }
    
    /**
     * Obtiene componentes actuales de la página
     */
    private function getCurrentComponents() {
        $components = array();
        
        // Detectar componentes basado en el contenido de la página
        $content = get_the_content();
        
        if (strpos($content, 'hero-section') !== false) {
            $components[] = 'hero-section';
        }
        
        if (strpos($content, 'course-card') !== false) {
            $components[] = 'course-card';
        }
        
        if (strpos($content, 'testimonials') !== false) {
            $components[] = 'testimonials';
        }
        
        return $components;
    }
    
    /**
     * Genera meta tags dinámicos
     */
    public function generateMetaTags() {
        $config = $this->getCurrentSEOConfig();
        
        $meta_tags = array();
        
        // Meta tags básicos
        $meta_tags[] = '<meta charset="UTF-8">';
        $meta_tags[] = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        $meta_tags[] = '<meta name="description" content="' . esc_attr($config['description']) . '">';
        $meta_tags[] = '<meta name="keywords" content="' . esc_attr($config['keywords']) . '">';
        $meta_tags[] = '<meta name="author" content="' . esc_attr($config['author']) . '">';
        $meta_tags[] = '<meta name="robots" content="index, follow">';
        
        // OpenGraph
        $meta_tags[] = '<meta property="og:title" content="' . esc_attr($config['title']) . '">';
        $meta_tags[] = '<meta property="og:description" content="' . esc_attr($config['description']) . '">';
        $meta_tags[] = '<meta property="og:type" content="' . esc_attr($config['ogType']) . '">';
        $meta_tags[] = '<meta property="og:url" content="' . esc_url(get_permalink()) . '">';
        $meta_tags[] = '<meta property="og:site_name" content="Toulouse Lautrec">';
        
        if (isset($config['ogImage'])) {
            $meta_tags[] = '<meta property="og:image" content="' . esc_url($config['ogImage']) . '">';
        }
        
        // Twitter Card
        $meta_tags[] = '<meta name="twitter:card" content="' . esc_attr($config['twitterCard']) . '">';
        $meta_tags[] = '<meta name="twitter:title" content="' . esc_attr($config['title']) . '">';
        $meta_tags[] = '<meta name="twitter:description" content="' . esc_attr($config['description']) . '">';
        
        // Canonical
        $meta_tags[] = '<link rel="canonical" href="' . esc_url(get_permalink()) . '">';
        
        return implode("\\n    ", $meta_tags);
    }
    
    /**
     * Genera JSON-LD estructurado
     */
    public function generateStructuredData() {
        $structured_data = array();
        
        // Datos básicos de la organización
        $structured_data[] = $this->generateOrganizationSchema();
        
        // Datos específicos del template
        if ($this->current_template && isset($this->seo_config['templates'][$this->current_template])) {
            $template_schema = $this->seo_config['templates'][$this->current_template]['schema'];
            if ($template_schema) {
                $structured_data[] = $this->generateTemplateSchema($template_schema);
            }
        }
        
        // Datos de componentes
        foreach ($this->current_components as $component) {
            if (isset($this->seo_config['components'][$component])) {
                $component_schema = $this->seo_config['components'][$component]['schema'];
                if ($component_schema) {
                    $structured_data[] = $this->generateComponentSchema($component, $component_schema);
                }
            }
        }
        
        return $structured_data;
    }
    
    /**
     * Genera schema de organización
     */
    private function generateOrganizationSchema() {
        return array(
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => 'Toulouse Lautrec',
            'url' => home_url(),
            'logo' => get_template_directory_uri() . '/assets/img/logo.png',
            'description' => 'Institución educativa especializada en diseño, tecnología y creatividad',
            'address' => array(
                '@type' => 'PostalAddress',
                'addressLocality' => 'Lima',
                'addressCountry' => 'PE'
            ),
            'contactPoint' => array(
                '@type' => 'ContactPoint',
                'contactType' => 'customer service',
                'telephone' => '+51-1-123-4567'
            )
        );
    }
    
    /**
     * Genera schema específico del template
     */
    private function generateTemplateSchema($schema_config) {
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => $schema_config['type']
        );
        
        // Agregar propiedades específicas según el tipo
        switch ($schema_config['type']) {
            case 'Course':
                $schema['name'] = get_the_title();
                $schema['description'] = get_the_excerpt();
                $schema['provider'] = $schema_config['provider'];
                break;
                
            case 'ContactPage':
                $schema['name'] = get_the_title();
                $schema['description'] = get_the_excerpt();
                if (isset($schema_config['contactPoint'])) {
                    $schema['contactPoint'] = $schema_config['contactPoint'];
                }
                break;
        }
        
        return $schema;
    }
    
    /**
     * Genera schema específico del componente
     */
    private function generateComponentSchema($component_name, $schema_config) {
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => $schema_config['type']
        );
        
        // Agregar propiedades específicas según el componente
        switch ($component_name) {
            case 'course-card':
                $schema['name'] = get_the_title();
                $schema['description'] = get_the_excerpt();
                $schema['provider'] = $schema_config['provider'];
                break;
                
            case 'testimonials':
                $schema['itemReviewed'] = $schema_config['itemReviewed'];
                $schema['reviewBody'] = get_the_content();
                $schema['author'] = array(
                    '@type' => 'Person',
                    'name' => get_post_meta(get_the_ID(), 'testimonial_author', true)
                );
                break;
        }
        
        return $schema;
    }
    
    /**
     * Obtiene configuración SEO actual
     */
    private function getCurrentSEOConfig() {
        $config = $this->seo_config['default'];
        
        // Sobrescribir con configuración específica del template
        if ($this->current_template && isset($this->seo_config['templates'][$this->current_template])) {
            $config = array_merge($config, $this->seo_config['templates'][$this->current_template]);
        }
        
        // Agregar datos dinámicos
        $config['title'] = $this->getDynamicTitle($config['title']);
        $config['description'] = $this->getDynamicDescription($config['description']);
        
        return $config;
    }
    
    /**
     * Genera título dinámico
     */
    private function getDynamicTitle($base_title) {
        $title = $base_title;
        
        // Reemplazar placeholders
        $title = str_replace('{site_name}', get_bloginfo('name'), $title);
        $title = str_replace('{page_title}', get_the_title(), $title);
        $title = str_replace('{category}', single_cat_title('', false), $title);
        
        return $title;
    }
    
    /**
     * Genera descripción dinámica
     */
    private function getDynamicDescription($base_description) {
        $description = $base_description;
        
        // Reemplazar placeholders
        $description = str_replace('{excerpt}', get_the_excerpt(), $description);
        $description = str_replace('{site_description}', get_bloginfo('description'), $description);
        
        return $description;
    }
}

// Inicializar SEO Manager con protección de errores
$toulouse_seo = null;
try {
    $toulouse_seo = new ToulouseSEOManager();
} catch (Exception $e) {
    error_log('Error inicializando ToulouseSEOManager: ' . $e->getMessage());
}

// Hook para agregar meta tags
function toulouse_seo_meta_tags() {
    global $toulouse_seo;
    if ($toulouse_seo && method_exists($toulouse_seo, 'generateMetaTags')) {
        echo $toulouse_seo->generateMetaTags();
    }
}
add_action('wp_head', 'toulouse_seo_meta_tags');

// Hook para agregar JSON-LD
function toulouse_seo_structured_data() {
    global $toulouse_seo;
    if ($toulouse_seo && method_exists($toulouse_seo, 'generateStructuredData')) {
        $structured_data = $toulouse_seo->generateStructuredData();
        
        if (!empty($structured_data)) {
            echo '<script type="application/ld+json">';
            echo json_encode($structured_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            echo '</script>';
        }
    }
}
add_action('wp_head', 'toulouse_seo_structured_data');

// Hook para analytics personalizados
function toulouse_seo_analytics() {
    $current_template = get_page_template_slug();
    $current_components = array();
    
    // Detectar componentes
    $content = get_the_content();
    if (strpos($content, 'hero-section') !== false) $current_components[] = 'hero-section';
    if (strpos($content, 'course-card') !== false) $current_components[] = 'course-card';
    if (strpos($content, 'testimonials') !== false) $current_components[] = 'testimonials';
    
    // Analytics específicos por template
    $analytics_events = array();
    
    switch ($current_template) {
        case 'page-carreras':
            $analytics_events[] = array(
                'event' => 'page_view',
                'category' => 'engagement',
                'action' => 'view',
                'label' => 'carreras_page'
            );
            break;
            
        case 'page-contacto':
            $analytics_events[] = array(
                'event' => 'page_view',
                'category' => 'engagement',
                'action' => 'view',
                'label' => 'contacto_page'
            );
            break;
    }
    
    // Analytics por componentes
    foreach ($current_components as $component) {
        $analytics_events[] = array(
            'event' => 'component_view',
            'category' => 'engagement',
            'action' => 'view',
            'label' => $component
        );
    }
    
    // Generar código de analytics
    if (!empty($analytics_events)) {
        echo '<script>';
        echo 'document.addEventListener("DOMContentLoaded", function() {';
        foreach ($analytics_events as $event) {
            echo 'if (typeof gtag !== "undefined") {';
            echo 'gtag("event", "' . $event['event'] . '", {';
            echo '"event_category": "' . $event['category'] . '",';
            echo '"event_action": "' . $event['action'] . '",';
            echo '"event_label": "' . $event['label'] . '"';
            echo '});';
            echo '}';
        }
        echo '});';
        echo '</script>';
    }
}
add_action('wp_footer', 'toulouse_seo_analytics');
?>`;
  }

  /**
   * Genera archivo de configuración SEO
   */
  generateSEOConfigFile() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    const seoConfigPath = path.join(themeDir, 'assets', 'seo-config.json');
    
    fs.writeFileSync(seoConfigPath, JSON.stringify(this.seoConfig, null, 2));
  }

  /**
   * Genera archivo PHP para SEO
   */
  generateSEOFile() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    const seoPath = path.join(themeDir, 'inc', 'seo-manager.php');
    
    // Crear directorio inc si no existe
    if (!fs.existsSync(path.dirname(seoPath))) {
      fs.mkdirSync(path.dirname(seoPath), { recursive: true });
    }

    const seoCode = this.generateSEOCode();
    fs.writeFileSync(seoPath, seoCode);
  }

  /**
   * Ejecuta la generación completa de SEO
   */
  generate() {
    console.log('🔍 Generando sistema SEO dinámico...');
    
    this.generateSEOConfigFile();
    this.generateSEOFile();
    
    console.log('✅ Sistema SEO generado');
  }
}

module.exports = SEOManager;
