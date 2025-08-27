const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AssetManager {
  constructor(config) {
    this.config = config;
  }

  build() {
    console.log('📦 Construyendo assets...');
    
    try {
      this.buildViteAssets();
      this.copyDesignTokens();
      this.copyViteAssets();
    } catch (error) {
      console.error('❌ Error construyendo assets:', error.message);
    }
  }

  buildViteAssets() {
    execSync('npm run build', { stdio: 'inherit' });
  }

  copyDesignTokens() {
    const tokensSource = path.join(this.config.srcDir, 'tokens', 'design-tokens.css');
    const tokensTarget = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'assets/css/design-tokens.css'
    );
    
    if (fs.existsSync(tokensSource)) {
      fs.copyFileSync(tokensSource, tokensTarget);
    }
  }

  copyViteAssets() {
    const distDir = './dist';
    if (!fs.existsSync(distDir)) return;

    const targetAssetsDir = path.join(
      this.config.outputDir, 
      this.config.themeName, 
      'assets'
    );

    this.copyDirectory(distDir, targetAssetsDir);
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
}

module.exports = AssetManager;