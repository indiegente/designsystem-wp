const fs = require('fs');
const path = require('path');

class ThemeStructure {
  constructor(config) {
    this.config = config;
  }

  create() {
    const themeDir = path.join(this.config.outputDir, this.config.themeName);
    
    const directories = [
      '',
      'assets/css',
      'assets/js',
      'assets/img',
      'components',
      'inc'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(themeDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    console.log('📁 Estructura del tema creada');
  }
}

module.exports = ThemeStructure;