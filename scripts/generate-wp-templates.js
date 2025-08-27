// scripts/generate-wp-templates.js
const fs = require('fs');
const path = require('path');

const components = [
  'hero-section',
  'course-card',
  'course-grid',
  'contact-form'
];

// Ensure dist directories exist
const distDir = 'dist/wordpress';
const componentsDir = `${distDir}/components`;
const assetsDir = `${distDir}/assets/css`;

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

components.forEach(componentName => {
  try {
    // Read the JavaScript component file
    const jsComponentPath = `src/components/${componentName}/${componentName}.js`;
    
    if (fs.existsSync(jsComponentPath)) {
      const jsContent = fs.readFileSync(jsComponentPath, 'utf8');
      
      // Generate HTML template from the component
      const htmlTemplate = generateHTMLTemplate(componentName);
      
      // Extract CSS from the component
      const cssStyles = extractCSSFromComponent(jsContent);
      
      // Convert to PHP template
      const phpTemplate = generatePHPTemplate(htmlTemplate, componentName);
      
      // Write WordPress files
      fs.writeFileSync(`${componentsDir}/${componentName}.php`, phpTemplate);
      fs.writeFileSync(`${assetsDir}/${componentName}.css`, cssStyles);
      
      console.log(`✅ Generated WordPress template for ${componentName}`);
    } else {
      console.log(`⚠️  Component ${componentName} not found, skipping...`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${componentName}:`, error.message);
  }
});

function generateHTMLTemplate(componentName) {
  // Generate HTML template based on component name
  const templates = {
    'hero-section': `
      <section class="hero">
        <img class="hero-bg" src="<?php echo esc_url($data['backgroundImage']); ?>" alt="" loading="eager" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title"><?php echo esc_html($data['title']); ?></h1>
          <p class="hero-subtitle"><?php echo esc_html($data['subtitle']); ?></p>
          <a href="#cursos" class="hero-cta"><?php echo esc_html($data['ctaText']); ?></a>
        </div>
      </section>
    `,
    'course-card': `
      <div class="course-card">
        <img class="course-image" src="<?php echo esc_url($data['image']); ?>" alt="<?php echo esc_attr($data['title']); ?>" />
        <div class="course-content">
          <h3 class="course-title"><?php echo esc_html($data['title']); ?></h3>
          <p class="course-description"><?php echo esc_html($data['description']); ?></p>
          <a href="<?php echo esc_url($data['link']); ?>" class="course-link">Ver más</a>
        </div>
      </div>
    `,
    'course-grid': `
      <div class="course-grid">
        <?php foreach ($data['courses'] as $course): ?>
          <div class="course-card">
            <img class="course-image" src="<?php echo esc_url($course['image']); ?>" alt="<?php echo esc_attr($course['title']); ?>" />
            <div class="course-content">
              <h3 class="course-title"><?php echo esc_html($course['title']); ?></h3>
              <p class="course-description"><?php echo esc_html($course['description']); ?></p>
              <a href="<?php echo esc_url($course['link']); ?>" class="course-link">Ver más</a>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    `,
    'contact-form': `
      <form class="contact-form" method="post">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="message">Mensaje</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit" class="submit-btn">Enviar</button>
      </form>
    `
  };
  
  return templates[componentName] || `<div class="${componentName}">Component template not found</div>`;
}

function extractCSSFromComponent(jsContent) {
  // Extract CSS from the component's static styles
  const cssMatch = jsContent.match(/static styles = css`([\s\S]*?)`/);
  if (cssMatch) {
    return cssMatch[1]
      .replace(/var\(--([^)]+)\)/g, 'var(--$1)') // Keep CSS variables
      .replace(/`/g, '') // Remove backticks
      .trim();
  }
  
  // Return default CSS if no styles found
  return `
    /* Default styles for component */
    .component {
      display: block;
    }
  `;
}

function generatePHPTemplate(html, componentName) {
  return `<?php
/**
 * Auto-generated from Design System
 * Component: ${componentName}
 * Last updated: ${new Date().toISOString()}
 */

// Get component data from WordPress
$data = get_component_data('${componentName}');

// Ensure $data is an array
if (!is_array($data)) {
  $data = array();
}
?>

${html}
`;
}
