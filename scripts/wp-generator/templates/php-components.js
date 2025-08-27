class PhpComponentTemplate {
  generate(componentName, props, cssClasses) {
    const functionName = `render_${componentName.replace('-', '_')}`;
    const propsParams = props.map(prop => `$${prop.name} = ''`).join(', ');
    
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
            <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>">
            <h3><?php echo esc_html($title); ?></h3>
            <p><?php echo esc_html($description); ?></p>
            <a href="<?php echo esc_url($link); ?>"><?php echo esc_html($link_text); ?></a>
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