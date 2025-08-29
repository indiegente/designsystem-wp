const fs = require('fs');
const path = require('path');

/**
 * ValidationManager - Gestión de validación y fallback avanzado
 * 
 * Maneja errores, validaciones previas y fallbacks seguros para
 * evitar errores en producción y mejorar la robustez del sistema.
 */
class ValidationManager {
  constructor(config) {
    this.config = config;
    this.validationRules = this.loadValidationRules();
    this.fallbackTemplates = this.loadFallbackTemplates();
  }

  /**
   * Carga reglas de validación desde archivo JSON
   */
  loadValidationRules() {
    const rulesPath = path.join(this.config.srcDir, 'validation-rules.json');
    
    if (fs.existsSync(rulesPath)) {
      return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }

    // Reglas por defecto
    return {
      components: {
        required: ['name', 'type'],
        types: ['static', 'iterative', 'aggregated', 'interactive'],
        props: {
          maxLength: 1000,
          requiredFields: ['title', 'description']
        }
      },
      templates: {
        required: ['name', 'components'],
        maxComponents: 10,
        requiredComponents: ['hero-section']
      },
      dataSources: {
        required: ['type', 'query'],
        validTypes: ['post', 'page', 'custom', 'api'],
        maxResults: 50
      },
      assets: {
        required: ['css', 'js'],
        maxSize: '1MB',
        allowedExtensions: ['.css', '.js', '.png', '.jpg', '.svg']
      }
    };
  }

  /**
   * Carga templates de fallback
   */
  loadFallbackTemplates() {
    return {
      component: {
        static: `
        <div class="component-fallback">
            <h3><?php echo esc_html($title ?: 'Componente'); ?></h3>
            <p><?php echo esc_html($description ?: 'Contenido no disponible'); ?></p>
        </div>`,
        
        iterative: `
        <div class="component-fallback-iterative">
            <?php if (!empty($items)): ?>
                <?php foreach ($items as $item): ?>
                    <div class="fallback-item">
                        <h4><?php echo esc_html($item['title'] ?: 'Elemento'); ?></h4>
                        <p><?php echo esc_html($item['description'] ?: 'Descripción no disponible'); ?></p>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p>No hay elementos disponibles.</p>
            <?php endif; ?>
        </div>`,
        
        aggregated: `
        <div class="component-fallback-aggregated">
            <h3><?php echo esc_html($title ?: 'Contenido Agregado'); ?></h3>
            <?php if (!empty($data)): ?>
                <div class="fallback-data">
                    <?php foreach ($data as $key => $value): ?>
                        <div class="data-item">
                            <strong><?php echo esc_html($key); ?>:</strong>
                            <span><?php echo esc_html($value); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <p>Datos no disponibles.</p>
            <?php endif; ?>
        </div>`
      },
      
      template: `
      <?php
      /*
      Template Name: Fallback Template
      */
      
      get_header();
      ?>
      
      <main class="fallback-content">
          <div class="container">
              <h1><?php the_title(); ?></h1>
              <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                  <div class="content">
                      <?php the_content(); ?>
                  </div>
              <?php endwhile; endif; ?>
          </div>
      </main>
      
      <?php get_footer(); ?>`,
      
      error: `
      <div class="error-fallback">
          <div class="error-content">
              <h2>Error de Carga</h2>
              <p>Lo sentimos, ha ocurrido un error al cargar este contenido.</p>
              <a href="<?php echo home_url(); ?>" class="btn-primary">Volver al inicio</a>
          </div>
      </div>`
    };
  }

  /**
   * Valida un componente antes del renderizado
   */
  validateComponent(component) {
    const errors = [];
    const warnings = [];

    // Validar campos requeridos
    if (!component.name) {
      errors.push('Componente sin nombre definido');
    }

    if (!component.type) {
      errors.push('Componente sin tipo definido');
    }

    // Validar tipo de componente
    if (component.type && !this.validationRules.components.types.includes(component.type)) {
      errors.push(`Tipo de componente inválido: ${component.type}`);
    }

    // Validar propiedades
    if (component.props) {
      Object.keys(component.props).forEach(prop => {
        const value = component.props[prop];
        
        if (typeof value === 'string' && value.length > this.validationRules.components.props.maxLength) {
          warnings.push(`Propiedad ${prop} excede longitud máxima`);
        }
      });
    }

    // Validar dataSource si existe
    if (component.dataSource) {
      const dataSourceErrors = this.validateDataSource(component.dataSource);
      errors.push(...dataSourceErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida un dataSource
   */
  validateDataSource(dataSource) {
    const errors = [];

    if (!dataSource.type) {
      errors.push('DataSource sin tipo definido');
    }

    if (dataSource.type && !this.validationRules.dataSources.validTypes.includes(dataSource.type)) {
      errors.push(`Tipo de dataSource inválido: ${dataSource.type}`);
    }

    if (dataSource.query && typeof dataSource.query !== 'object') {
      errors.push('Query de dataSource debe ser un objeto');
    }

    if (dataSource.maxResults && dataSource.maxResults > this.validationRules.dataSources.maxResults) {
      errors.push(`maxResults excede límite: ${dataSource.maxResults}`);
    }

    return errors;
  }

  /**
   * Valida un template
   */
  validateTemplate(template) {
    const errors = [];
    const warnings = [];

    if (!template.name) {
      errors.push('Template sin nombre definido');
    }

    if (!template.components || !Array.isArray(template.components)) {
      errors.push('Template sin componentes definidos');
    }

    if (template.components && template.components.length > this.validationRules.templates.maxComponents) {
      warnings.push(`Template tiene demasiados componentes: ${template.components.length}`);
    }

    // Validar componentes requeridos
    const hasRequiredComponent = template.components && 
      template.components.some(comp => this.validationRules.templates.requiredComponents.includes(comp.name));
    
    if (!hasRequiredComponent) {
      warnings.push('Template no tiene componentes requeridos');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera código de fallback para un componente
   */
  generateComponentFallback(component, error) {
    const fallbackType = component.type || 'static';
    let fallbackCode = this.fallbackTemplates.component[fallbackType] || this.fallbackTemplates.component.static;

    // Agregar información de error para debugging
    fallbackCode = `
    <?php
    // Fallback generado automáticamente
    // Error: ${error}
    // Componente: ${component.name}
    // Tipo: ${component.type}
    ?>
    ${fallbackCode}`;

    return fallbackCode;
  }

  /**
   * Genera código de fallback para un template
   */
  generateTemplateFallback(template, error) {
    let fallbackCode = this.fallbackTemplates.template;

    // Agregar información de error para debugging
    fallbackCode = `
    <?php
    /*
    Template Name: ${template.name} - Fallback
    Error: ${error}
    */
    ?>
    ${fallbackCode}`;

    return fallbackCode;
  }

  /**
   * Genera código de manejo de errores
   */
  generateErrorHandlingCode() {
    return `<?php
/**
 * Error Handling - Generado automáticamente
 * Manejo seguro de errores y fallbacks
 */

// Función para manejar errores de componentes
function toulouse_handle_component_error($component_name, $error_message, $fallback_data = array()) {
    // Log del error
    error_log("Toulouse Component Error: {$component_name} - {$error_message}");
    
    // Generar fallback
    $fallback_html = toulouse_generate_component_fallback($component_name, $fallback_data);
    
    // Agregar información de debugging en desarrollo
    if (WP_DEBUG) {
        $fallback_html = '<div class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 3px solid #ff0000;">
            <strong>Debug:</strong> Error en componente {$component_name}: {$error_message}
        </div>' . $fallback_html;
    }
    
    return $fallback_html;
}

// Función para generar fallback de componente
function toulouse_generate_component_fallback($component_name, $fallback_data = array()) {
    $title = isset($fallback_data['title']) ? $fallback_data['title'] : 'Componente';
    $description = isset($fallback_data['description']) ? $fallback_data['description'] : 'Contenido no disponible';
    
    return '<div class="component-fallback component-{$component_name}">
        <h3>' . esc_html($title) . '</h3>
        <p>' . esc_html($description) . '</p>
        <div class="fallback-notice">
            <small>Este contenido se muestra como fallback debido a un error de carga.</small>
        </div>
    </div>';
}

// Función para validar datos antes del renderizado
function toulouse_validate_component_data($data, $required_fields = array()) {
    if (!is_array($data)) {
        return false;
    }
    
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return false;
        }
    }
    
    return true;
}

// Función para sanitizar datos de entrada
function toulouse_sanitize_component_data($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = sanitize_text_field($value);
            } elseif (is_array($value)) {
                $data[$key] = toulouse_sanitize_component_data($value);
            }
        }
    }
    
    return $data;
}

// Hook para manejar errores fatales
function toulouse_fatal_error_handler() {
    $error = error_get_last();
    
    if ($error && $error['type'] === E_ERROR) {
        // Log del error fatal
        error_log("Toulouse Fatal Error: " . $error['message']);
        
        // Mostrar página de error amigable
        if (!is_admin()) {
            echo '<!DOCTYPE html>
            <html>
            <head>
                <title>Error - Toulouse Lautrec</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error-container { max-width: 600px; margin: 0 auto; }
                    .error-title { color: #e74c3c; font-size: 2em; margin-bottom: 20px; }
                    .error-message { color: #666; margin-bottom: 30px; }
                    .error-button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-title">Ha ocurrido un error</div>
                    <div class="error-message">Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta nuevamente.</div>
                    <a href="' . home_url() . '" class="error-button">Volver al inicio</a>
                </div>
            </body>
            </html>';
            exit;
        }
    }
}
register_shutdown_function('toulouse_fatal_error_handler');

// Hook para manejar errores de consulta de base de datos
function toulouse_handle_query_error($query) {
    if (is_wp_error($query)) {
        error_log("Toulouse Query Error: " . $query->get_error_message());
        return array(); // Retornar array vacío en lugar de error
    }
    return $query;
}

// Función para verificar si un componente está disponible
function toulouse_component_exists($component_name) {
    $component_file = get_template_directory() . '/components/' . $component_name . '/' . $component_name . '.php';
    return file_exists($component_file);
}

// Función para cargar componente con fallback
function toulouse_load_component_safe($component_name, $props = array()) {
    if (!toulouse_component_exists($component_name)) {
        return toulouse_handle_component_error($component_name, 'Componente no encontrado', $props);
    }
    
    try {
        // Validar datos de entrada
        $props = toulouse_sanitize_component_data($props);
        
        // Cargar componente
        $function_name = 'render_' . str_replace('-', '_', $component_name);
        
        if (function_exists($function_name)) {
            return call_user_func($function_name, $props);
        } else {
            return toulouse_handle_component_error($component_name, 'Función de renderizado no encontrada', $props);
        }
    } catch (Exception $e) {
        return toulouse_handle_component_error($component_name, $e->getMessage(), $props);
    }
}

// Hook para agregar información de debugging
function toulouse_debug_info() {
    if (WP_DEBUG && current_user_can('administrator')) {
        echo '<div class="toulouse-debug-info" style="position: fixed; bottom: 10px; right: 10px; background: #333; color: white; padding: 10px; font-size: 12px; z-index: 9999;">
            <strong>Toulouse Debug:</strong><br>
            Template: ' . get_page_template_slug() . '<br>
            Components: ' . count(toulouse_get_current_components()) . '<br>
            Memory: ' . round(memory_get_usage() / 1024 / 1024, 2) . 'MB
        </div>';
    }
}
add_action('wp_footer', 'toulouse_debug_info');

// Función para obtener componentes actuales
function toulouse_get_current_components() {
    $components = array();
    $content = get_the_content();
    
    // Detectar componentes en el contenido
    $component_patterns = array(
        'hero-section' => '/hero-section/',
        'course-card' => '/course-card/',
        'testimonials' => '/testimonials/',
        'feature-grid' => '/feature-grid/',
        'interactive-gallery' => '/interactive-gallery/'
    );
    
    foreach ($component_patterns as $component => $pattern) {
        if (preg_match($pattern, $content)) {
            $components[] = $component;
        }
    }
    
    return $components;
}
?>`;
  }

  /**
   * Genera archivo de validación
   */
  generateValidationFile() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    const validationPath = path.join(themeDir, 'inc', 'validation.php');
    
    // Crear directorio inc si no existe
    if (!fs.existsSync(path.dirname(validationPath))) {
      fs.mkdirSync(path.dirname(validationPath), { recursive: true });
    }

    const validationCode = this.generateErrorHandlingCode();
    fs.writeFileSync(validationPath, validationCode);
  }

  /**
   * Genera archivo de reglas de validación
   */
  generateValidationRulesFile() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    const rulesPath = path.join(themeDir, 'assets', 'validation-rules.json');
    
    fs.writeFileSync(rulesPath, JSON.stringify(this.validationRules, null, 2));
  }

  /**
   * Ejecuta validación completa
   */
  validateGeneration() {
    console.log('🔍 Ejecutando validación completa...');
    
    const results = {
      components: [],
      templates: [],
      assets: [],
      overall: { isValid: true, errors: [], warnings: [] }
    };

    // Validar componentes
    const componentsDir = path.join(this.config.srcDir, 'components');
    if (fs.existsSync(componentsDir)) {
      const componentDirs = fs.readdirSync(componentsDir);
      
      componentDirs.forEach(componentName => {
        const componentPath = path.join(componentsDir, componentName);
        if (fs.statSync(componentPath).isDirectory()) {
          const component = { name: componentName, type: 'static' };
          const validation = this.validateComponent(component);
          
          results.components.push({
            name: componentName,
            ...validation
          });

          if (!validation.isValid) {
            results.overall.isValid = false;
            results.overall.errors.push(`Componente ${componentName}: ${validation.errors.join(', ')}`);
          }
          
          if (validation.warnings.length > 0) {
            results.overall.warnings.push(`Componente ${componentName}: ${validation.warnings.join(', ')}`);
          }
        }
      });
    }

    // Validar templates
    const templatesPath = path.join(this.config.srcDir, 'page-templates.json');
    if (fs.existsSync(templatesPath)) {
      const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
      
      Object.keys(templates).forEach(templateName => {
        const template = { name: templateName, ...templates[templateName] };
        const validation = this.validateTemplate(template);
        
        results.templates.push({
          name: templateName,
          ...validation
        });

        if (!validation.isValid) {
          results.overall.isValid = false;
          results.overall.errors.push(`Template ${templateName}: ${validation.errors.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          results.overall.warnings.push(`Template ${templateName}: ${validation.warnings.join(', ')}`);
        }
      });
    }

    // Generar archivos de validación
    this.generateValidationFile();
    this.generateValidationRulesFile();

    // Mostrar resultados
    console.log('📊 Resultados de validación:');
    console.log(`✅ Componentes válidos: ${results.components.filter(c => c.isValid).length}/${results.components.length}`);
    console.log(`✅ Templates válidos: ${results.templates.filter(t => t.isValid).length}/${results.templates.length}`);
    
    if (results.overall.errors.length > 0) {
      console.log('❌ Errores encontrados:');
      results.overall.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (results.overall.warnings.length > 0) {
      console.log('⚠️ Advertencias:');
      results.overall.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    return results.overall.isValid;
  }
}

module.exports = ValidationManager;
