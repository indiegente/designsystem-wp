/**
 * SEO Editable Manager
 *
 * Convierte componentes static en dynamic con campos ACF editables
 * para dar control total al equipo SEO sobre contenido y estructura.
 */

const fs = require('fs');
const path = require('path');

class SEOEditableManager {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadMetadata();
    this.pageTemplates = this.loadPageTemplates();
  }

  loadMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'metadata.json');
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }

  loadPageTemplates() {
    const templatesPath = path.join(this.config.srcDir, 'page-templates.json');
    return JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
  }

  /**
   * Analiza qué páginas tienen configuración SEO para hacer editable
   */
  analyzeSEOEditablePages() {
    const editablePages = [];

    for (const [pageName, pageConfig] of Object.entries(this.pageTemplates)) {
      if (pageConfig.seo) {
        editablePages.push({
          pageName,
          currentSEO: pageConfig.seo,
          pageTitle: pageConfig.title || pageName,
          seoFields: this.getDefaultSEOFields()
        });
      }
    }

    return editablePages;
  }

  /**
   * Define los campos SEO estándar que todas las páginas pueden editar
   */
  getDefaultSEOFields() {
    return [
      {
        name: 'title',
        label: 'Meta Title (SEO)',
        type: 'text',
        instructions: 'Título que aparece en resultados de búsqueda. Recomendado: 50-60 caracteres.',
        maxlength: 60,
        required: true
      },
      {
        name: 'description',
        label: 'Meta Description (SEO)',
        type: 'textarea',
        instructions: 'Descripción en resultados de búsqueda. Recomendado: 150-160 caracteres.',
        maxlength: 160,
        required: true
      },
      {
        name: 'keywords',
        label: 'Palabras Clave',
        type: 'text',
        instructions: 'Palabras clave separadas por comas. Máximo 5-7 keywords.',
        maxlength: 100,
        required: false
      },
      {
        name: 'canonical',
        label: 'URL Canónica',
        type: 'text',
        instructions: 'URL canónica para evitar contenido duplicado. Puede ser relativa (ej: /carreras) o absoluta.',
        required: false
      },
      {
        name: 'ogImage',
        label: 'Imagen Open Graph',
        type: 'image',
        instructions: 'Imagen que aparece al compartir en redes sociales. Recomendado: 1200x630px.',
        required: false
      }
    ];
  }


  /**
   * Genera ACF fields para páginas editables por SEO
   */
  generateSEOACFFields() {
    const editablePages = this.analyzeSEOEditablePages();
    const acfGroups = [];

    editablePages.forEach(page => {
      const fields = [];

      // Separador visual en WordPress Admin
      fields.push({
        key: `field_${page.pageName}_seo_separator`,
        label: `🎯 ${page.pageTitle.toUpperCase()} - Configuración SEO`,
        name: `${page.pageName}_seo_separator`,
        type: 'message',
        message: 'Edita la configuración SEO de esta página:'
      });

      // Generar campos SEO
      page.seoFields.forEach(field => {
        fields.push({
          key: `field_${page.pageName}_seo_${field.name}`,
          label: field.label,
          name: `${page.pageName}_seo_${field.name}`,
          type: field.type,
          default_value: page.currentSEO[field.name] || '',
          instructions: field.instructions,
          required: field.required || false,
          ...(field.maxlength && {
            maxlength: field.maxlength
          }),
          ...(field.type === 'textarea' && {
            rows: 3
          })
        });
      });

      // Crear grupo ACF para la página
      acfGroups.push({
        key: `group_${page.pageName}_seo_editable`,
        title: `🎯 ${page.pageTitle} - SEO`,
        fields: fields,
        location: [
          [
            {
              param: 'page_template',
              operator: '==',
              value: `${page.pageName}.php`
            }
          ]
        ],
        menu_order: 0,
        position: 'normal',
        style: 'default',
        label_placement: 'top',
        instruction_placement: 'label'
      });
    });

    return acfGroups;
  }


  /**
   * Formatea título de página para display
   */
  formatPageTitle(pageName) {
    return pageName
      .replace('page-', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Capitaliza palabras
   */
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Convierte un objeto JavaScript a formato de array PHP
   */
  convertToPhpArray(obj, indent = 0) {
    const indentStr = '  '.repeat(indent);

    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'array()';
      const items = obj.map(item => `${indentStr}  ${this.convertToPhpArray(item, indent + 1)}`).join(',\n');
      return `array(\n${items}\n${indentStr})`;
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return 'array()';

      const items = entries.map(([key, value]) => {
        const phpKey = `'${key.replace(/'/g, "\\'")}'`;
        const phpValue = this.convertToPhpArray(value, indent + 1);
        return `${indentStr}  ${phpKey} => ${phpValue}`;
      }).join(',\n');

      return `array(\n${items}\n${indentStr})`;
    }

    return "''";
  }

  /**
   * Genera archivo ACF completo
   */
  generateACFFile() {
    const acfGroups = this.generateSEOACFFields();

    let phpContent = `<?php
/**
 * ACF Fields para Edición de Contenido SEO
 * Auto-generado por SEO Editable Manager
 *
 * Permite al equipo SEO editar títulos, descripciones, encabezados
 * y todo el contenido textual desde WordPress Admin.
 */

if (function_exists('acf_add_local_field_group')) {
`;

    acfGroups.forEach(group => {
      phpContent += `
  // ${group.title}
  acf_add_local_field_group(${this.convertToPhpArray(group)});
`;
    });

    phpContent += `
}

/**
 * Helper function para obtener configuración SEO editable por página
 */
function get_page_seo_field($page_name, $field_name, $default_value = '') {
  $field_key = $page_name . '_seo_' . $field_name;
  $value = get_field($field_key);

  return !empty($value) ? $value : $default_value;
}

/**
 * Helper function para obtener el meta title de la página actual
 */
function get_current_page_seo_title($default_title = '') {
  global $post;
  if (!$post) return $default_title;

  $template = get_page_template_slug($post->ID);
  $page_name = str_replace('.php', '', $template);

  return get_page_seo_field($page_name, 'title', $default_title);
}

/**
 * Helper function para obtener la meta description de la página actual
 */
function get_current_page_seo_description($default_description = '') {
  global $post;
  if (!$post) return $default_description;

  $template = get_page_template_slug($post->ID);
  $page_name = str_replace('.php', '', $template);

  return get_page_seo_field($page_name, 'description', $default_description);
}

/**
 * Clase para manejar SEO dinámico integrado con ACF
 */
class ToulouseSEOManager {

    public function __construct() {
        add_action('wp_head', array($this, 'generateMetaTags'), 1);
        add_action('wp_head', array($this, 'generateJSONLD'), 2);
    }

    /**
     * Obtiene configuración SEO de ACF de la página actual
     */
    private function getCurrentSEOConfig() {
        global $post;
        if (!$post) return $this->getDefaultSEOConfig();

        $template = get_page_template_slug($post->ID);
        $page_name = str_replace('.php', '', $template);

        return array(
            'title' => get_current_page_seo_title(get_the_title()),
            'description' => get_current_page_seo_description(get_bloginfo('description')),
            'keywords' => get_page_seo_field($page_name, 'keywords', ''),
            'canonical' => get_page_seo_field($page_name, 'canonical', get_permalink()),
            'ogImage' => get_page_seo_field($page_name, 'ogImage', ''),
            'ogType' => 'website',
            'author' => 'Toulouse Lautrec'
        );
    }

    /**
     * Configuración SEO por defecto
     */
    private function getDefaultSEOConfig() {
        return array(
            'title' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'keywords' => '',
            'canonical' => get_permalink(),
            'ogImage' => '',
            'ogType' => 'website',
            'author' => 'Toulouse Lautrec'
        );
    }

    /**
     * Genera meta tags dinámicos
     */
    public function generateMetaTags() {
        $config = $this->getCurrentSEOConfig();

        echo "<!-- SEO Meta Tags -->\n";
        echo '<meta name="description" content="' . esc_attr($config['description']) . '">' . "\n";

        if (!empty($config['keywords'])) {
            echo '<meta name="keywords" content="' . esc_attr($config['keywords']) . '">' . "\n";
        }

        echo '<meta name="author" content="' . esc_attr($config['author']) . '">' . "\n";
        echo '<link rel="canonical" href="' . esc_url($config['canonical']) . '">' . "\n";

        // OpenGraph
        echo "<!-- OpenGraph Meta Tags -->\n";
        echo '<meta property="og:title" content="' . esc_attr($config['title']) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($config['description']) . '">' . "\n";
        echo '<meta property="og:type" content="' . esc_attr($config['ogType']) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url(get_permalink()) . '">' . "\n";
        echo '<meta property="og:site_name" content="Toulouse Lautrec">' . "\n";

        if (!empty($config['ogImage'])) {
            echo '<meta property="og:image" content="' . esc_url($config['ogImage']) . '">' . "\n";
        }

        // Twitter Cards
        echo "<!-- Twitter Card Meta Tags -->\n";
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($config['title']) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($config['description']) . '">' . "\n";

        if (!empty($config['ogImage'])) {
            echo '<meta name="twitter:image" content="' . esc_url($config['ogImage']) . '">' . "\n";
        }
    }

    /**
     * Genera JSON-LD para SEO estructurado
     */
    public function generateJSONLD() {
        $config = $this->getCurrentSEOConfig();

        $jsonld = array(
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => $config['title'],
            'description' => $config['description'],
            'url' => get_permalink(),
            'publisher' => array(
                '@type' => 'Organization',
                'name' => 'Toulouse Lautrec',
                'url' => home_url()
            )
        );

        if (!empty($config['ogImage'])) {
            $jsonld['image'] = $config['ogImage'];
        }

        echo '<script type="application/ld+json">' . wp_json_encode($jsonld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
    }
}

// Inicializar SEO Manager
if (!is_admin()) {
    new ToulouseSEOManager();
}
?>`;

    return phpContent;
  }

  /**
   * Método principal - ejecuta toda la generación
   */
  async generate() {
    console.log('🎯 Generando sistema de edición SEO...');

    // 1. Analizar páginas editables
    const editablePages = this.analyzeSEOEditablePages();
    console.log(`   Encontradas ${editablePages.length} páginas editables`);

    // 2. Generar ACF fields
    const acfContent = this.generateACFFile();

    // 3. Escribir archivo
    const incDir = path.join(this.config.outputDir, this.config.themeName, 'inc');
    if (!fs.existsSync(incDir)) {
      fs.mkdirSync(incDir, { recursive: true });
    }
    const outputPath = path.join(incDir, 'seo-editable-fields.php');
    fs.writeFileSync(outputPath, acfContent, 'utf8');

    console.log(`✅ Archivo SEO editable generado: ${outputPath}`);

    // 4. Generar reporte para el equipo
    this.generateSEOReport(editablePages);

    return {
      success: true,
      editablePages: editablePages.length,
      filePath: outputPath
    };
  }

  /**
   * Genera reporte para el equipo SEO
   */
  generateSEOReport(editablePages) {
    const report = {
      summary: {
        totalPages: Object.keys(this.pageTemplates).length,
        editablePages: editablePages.length,
        totalSEOFields: editablePages.reduce((sum, page) => sum + page.seoFields.length, 0)
      },
      pages: editablePages.reduce((acc, page) => {
        acc[page.pageName] = {
          title: page.pageTitle,
          seoFields: page.seoFields.map(f => f.name),
          currentValues: page.currentSEO
        };
        return acc;
      }, {})
    };

    const reportPath = path.join(this.config.outputDir, this.config.themeName, 'seo-editable-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log('📊 Reporte SEO generado:', reportPath);
    return report;
  }
}

module.exports = SEOEditableManager;