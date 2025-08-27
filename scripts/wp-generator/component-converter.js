const fs = require('fs');
const path = require('path');
const PhpComponentTemplate = require('./templates/php-components');

class ComponentConverter {
  constructor(config) {
    this.config = config;
    this.phpTemplate = new PhpComponentTemplate();
  }

  async convertAll() {
    const componentsDir = path.join(this.config.srcDir, 'components');
    const components = fs.readdirSync(componentsDir);

    for (const componentName of components) {
      const componentPath = path.join(componentsDir, componentName);
      if (fs.statSync(componentPath).isDirectory()) {
        await this.convertSingle(componentName, componentPath);
      }
    }
  }

  async convertSingle(componentName, componentPath) {
    const litFile = path.join(componentPath, `${componentName}.js`);
    
    if (!fs.existsSync(litFile)) {
      console.warn(`⚠️ No se encontró ${litFile}`);
      return;
    }

    const litContent = fs.readFileSync(litFile, 'utf8');
    const phpComponent = this.litToPhp(componentName, litContent);
    
    const outputPath = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'components', 
      componentName,
      `${componentName}.php`
    );
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, phpComponent);
    
    console.log(`✅ Convertido: ${componentName}`);
  }

  litToPhp(componentName, litContent) {
    const props = this.extractPropsFromLit(litContent);
    const cssClasses = this.extractCssClasses(litContent);
    
    return this.phpTemplate.generate(componentName, props, cssClasses);
  }

  extractPropsFromLit(litContent) {
    const propMatches = litContent.match(/static properties = \{([^}]+)\}/s);
    if (!propMatches) return [];

    const propsString = propMatches[1];
    const props = [];
    
    const propRegex = /(\w+):\s*\{\s*type:\s*(\w+)/g;
    let match;
    
    while ((match = propRegex.exec(propsString)) !== null) {
      props.push({
        name: match[1],
        type: match[2].toLowerCase()
      });
    }
    
    return props;
  }

  extractCssClasses(litContent) {
    const cssMatches = litContent.match(/css`([^`]+)`/s);
    if (!cssMatches) return '';
    
    return cssMatches[1];
  }
}

module.exports = ComponentConverter;