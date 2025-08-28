const ComponentGenerator = require('../component-generator');

class PhpComponentTemplate {
  constructor(config) {
    this.config = config;
    this.componentGenerator = new ComponentGenerator(config);
  }

  generate(componentName, props, cssClasses) {
    const functionName = `render_${componentName.replace('-', '_')}`;
    
    // Usar metadata para generar parámetros
    const propsParams = this.componentGenerator.generatePhpParameters(componentName) || 
      props.map(prop => `$${prop.name} = ''`).join(', ');
    
    return `<?php
/**
 * ${componentName} Component
 * Auto-generated from Lit component
 */

function ${functionName}(${propsParams}) {
    ?>
    <div class="${componentName}">
        ${this.generatePhpTemplate(componentName, props)}
    </div>
    
    <style>
    .${componentName} {
        ${cssClasses}
    }
    </style>
    <?php
}

// Hook para registrar estilos
add_action('wp_head', function() {
    // Estilos inline para ${componentName}
});
?>`;
  }

  generatePhpTemplate(componentName, props) {
    const templates = {
      'hero-section': `
        <div class="hero-content">
            <h1><?php echo esc_html($title); ?></h1>
            <p><?php echo esc_html($subtitle); ?></p>
            <?php if ($cta_text): ?>
                <a href="<?php echo esc_url($cta_url); ?>" class="hero-cta">
                    <?php echo esc_html($cta_text); ?>
                </a>
            <?php endif; ?>
        </div>`,
      
      'course-card': `
        <div class="course-card-content">
            <?php if ($image): ?>
                <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>">
            <?php endif; ?>
            <h3><?php echo esc_html($title); ?></h3>
            <p><?php echo esc_html($description); ?></p>
            <a href="<?php echo esc_url($link); ?>"><?php echo esc_html($link_text); ?></a>
        </div>`,
      
      'testimonials': `
        <div class="testimonials-section">
            <div class="testimonials-container">
                <div class="testimonials-header">
                    <h2 class="testimonials-title"><?php echo esc_html($title); ?></h2>
                    <p class="testimonials-subtitle"><?php echo esc_html($subtitle); ?></p>
                </div>
                
                <div class="testimonials-grid">
                    <?php if (!empty($testimonials)): ?>
                        <?php foreach ($testimonials as $testimonial): ?>
                            <div class="testimonial-card">
                                <div class="rating">
                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                        <span class="star"><?php echo $i <= $testimonial['rating'] ? '★' : '☆'; ?></span>
                                    <?php endfor; ?>
                                </div>
                                <p class="testimonial-content">"<?php echo esc_html($testimonial['content']); ?>"</p>
                                <div class="testimonial-author">
                                    <?php if (!empty($testimonial['avatar'])): ?>
                                        <img src="<?php echo esc_url($testimonial['avatar']); ?>" alt="<?php echo esc_attr($testimonial['name']); ?>" class="author-avatar" />
                                    <?php else: ?>
                                        <div class="author-avatar" style="background: var(--tl-primary-500); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                            <?php echo esc_html(strtoupper(substr($testimonial['name'], 0, 1))); ?>
                                        </div>
                                    <?php endif; ?>
                                    <div class="author-info">
                                        <div class="author-name"><?php echo esc_html($testimonial['name']); ?></div>
                                        <div class="author-role"><?php echo esc_html($testimonial['role']); ?></div>
                                        <?php if (!empty($testimonial['course'])): ?>
                                            <div class="author-course"><?php echo esc_html($testimonial['course']); ?></div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p>No hay testimonios disponibles.</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>`,
      
      'feature-grid': `
        <div class="feature-grid-section">
            <div class="feature-grid-container">
                <div class="feature-grid-header">
                    <h2 class="feature-grid-title"><?php echo esc_html($title); ?></h2>
                    <p class="feature-grid-subtitle"><?php echo esc_html($subtitle); ?></p>
                </div>
                
                <div class="feature-grid">
                    <?php if (!empty($features)): ?>
                        <?php foreach ($features as $feature): ?>
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <?php echo esc_html($feature['icon']); ?>
                                </div>
                                <h3 class="feature-title"><?php echo esc_html($feature['title']); ?></h3>
                                <p class="feature-description"><?php echo esc_html($feature['description']); ?></p>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p>No hay características disponibles.</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>`
    };

    return templates[componentName] || `
        <!-- Template genérico para ${componentName} -->
        <?php foreach ($props as $prop => $value): ?>
            <span class="<?php echo esc_attr($prop); ?>">
                <?php echo esc_html($value); ?>
            </span>
        <?php endforeach; ?>`;
  }
}

module.exports = PhpComponentTemplate;