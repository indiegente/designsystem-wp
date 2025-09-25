const ValidatorInterface = require('../core/validator-interface');
const fs = require('fs');
const path = require('path');

/**
 * Structure Validator
 *
 * Validator para estructura de directorios y archivos que valida:
 * - Estructura correcta de tema WordPress
 * - Presencia de archivos requeridos
 * - Estructura de componentes generados
 * - Assets y dependencias correctas
 */
class StructureValidator extends ValidatorInterface {
  constructor(config = {}) {
    super('Structure Validator', config);
    this.requiredSources = []; // No requiere sources específicas
  }

  /**
   * Ejecuta validaciones de estructura
   * @param {Object} sources - Fuentes de datos (no requeridas)
   * @param {Object} context - Contexto ({ themePath?, strict? })
   */
  async validate(sources, context = {}) {
    const { themePath = 'wordpress-output', strict = false } = context;

    console.log(`   📁 Validando estructura de directorios...`);

    // Resolver ruta del tema
    const fullThemePath = this.resolveThemePath(themePath);

    if (!fs.existsSync(fullThemePath)) {
      this.assert(
        false,
        `Directorio del tema no encontrado: ${fullThemePath}`,
        'error',
        { type: 'theme-directory-missing', path: fullThemePath }
      );
      return;
    }

    // Validaciones de estructura
    this.validateThemeStructure(fullThemePath, strict);
    this.validateRequiredFiles(fullThemePath, strict);
    this.validateComponentsStructure(fullThemePath);
    this.validateAssetsStructure(fullThemePath);
    this.validateIncludesStructure(fullThemePath);

    // Estadísticas
    this.reportStructureStats(fullThemePath);
  }

  /**
   * Resolver ruta completa del tema
   */
  resolveThemePath(themePath) {
    if (path.isAbsolute(themePath)) {
      return themePath;
    }

    const possiblePaths = [
      path.join(process.cwd(), themePath),
      path.join(process.cwd(), 'wordpress-output', 'toulouse-lautrec'),
      path.join(process.cwd(), 'wordpress-output')
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        const hasThemeIndicator = fs.existsSync(path.join(possiblePath, 'style.css')) ||
                                 fs.existsSync(path.join(possiblePath, 'functions.php'));
        if (hasThemeIndicator) {
          return possiblePath;
        }

        // Buscar en subdirectorios
        try {
          const subdirs = fs.readdirSync(possiblePath)
            .filter(item => fs.statSync(path.join(possiblePath, item)).isDirectory());

          for (const subdir of subdirs) {
            const subPath = path.join(possiblePath, subdir);
            const hasThemeIndicator = fs.existsSync(path.join(subPath, 'style.css')) ||
                                     fs.existsSync(path.join(subPath, 'functions.php'));
            if (hasThemeIndicator) {
              return subPath;
            }
          }
        } catch (error) {
          // Si no se puede leer el directorio, continuar
        }
      }
    }

    return themePath;
  }

  /**
   * Validar estructura general del tema
   */
  validateThemeStructure(themePath, strict = false) {
    const requiredDirs = [
      'assets',
      'components'
    ];

    const optionalDirs = [
      'inc',
      'assets/css',
      'assets/js',
      'assets/img'
    ];

    console.log(`      📋 Validando estructura base...`);

    // Directorios requeridos
    requiredDirs.forEach(dirName => {
      const dirPath = path.join(themePath, dirName);
      this.assert(
        fs.existsSync(dirPath),
        `Directorio requerido faltante: ${dirName}`,
        'error',
        {
          type: 'missing-required-directory',
          directory: dirName,
          expectedPath: dirPath
        }
      );
    });

    // Directorios opcionales (solo advertencia si strict = true)
    if (strict) {
      optionalDirs.forEach(dirName => {
        const dirPath = path.join(themePath, dirName);
        this.assert(
          fs.existsSync(dirPath),
          `Directorio recomendado faltante: ${dirName}`,
          'warning',
          {
            type: 'missing-optional-directory',
            directory: dirName,
            expectedPath: dirPath,
            recommendation: 'Considerar crear este directorio para estructura completa'
          }
        );
      });
    }
  }

  /**
   * Validar archivos requeridos del tema WordPress
   */
  validateRequiredFiles(themePath, strict = false) {
    console.log(`      📄 Validando archivos requeridos...`);

    const requiredFiles = [
      { name: 'style.css', critical: true },
      { name: 'functions.php', critical: true },
      { name: 'index.php', critical: true }
    ];

    const recommendedFiles = [
      { name: 'header.php', critical: false },
      { name: 'footer.php', critical: false },
      { name: '404.php', critical: false },
      { name: 'search.php', critical: false }
    ];

    // Archivos críticos
    requiredFiles.forEach(({ name, critical }) => {
      const filePath = path.join(themePath, name);
      this.assert(
        fs.existsSync(filePath),
        `Archivo requerido de tema WordPress faltante: ${name}`,
        critical ? 'error' : 'warning',
        {
          type: 'missing-theme-file',
          file: name,
          critical,
          expectedPath: filePath,
          fix: `Crear ${name} según estándares de WordPress`
        }
      );

      // Validar contenido básico
      if (fs.existsSync(filePath)) {
        this.validateFileContent(filePath, name);
      }
    });

    // Archivos recomendados (solo si strict)
    if (strict) {
      recommendedFiles.forEach(({ name, critical }) => {
        const filePath = path.join(themePath, name);
        this.assert(
          fs.existsSync(filePath),
          `Archivo recomendado faltante: ${name}`,
          'warning',
          {
            type: 'missing-recommended-file',
            file: name,
            expectedPath: filePath,
            recommendation: 'Archivo recomendado para tema completo'
          }
        );
      });
    }
  }

  /**
   * Validar contenido básico de archivos críticos
   */
  validateFileContent(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');

    switch (fileName) {
      case 'style.css':
        // Validar header de tema WordPress
        const hasThemeHeader = content.includes('Theme Name:') &&
                              content.includes('Description:') &&
                              content.includes('Version:');
        this.assert(
          hasThemeHeader,
          'style.css debe contener header de tema WordPress válido',
          'error',
          {
            type: 'invalid-style-header',
            file: fileName,
            fix: 'Agregar Theme Name, Description, Version en comentario de header'
          }
        );
        break;

      case 'functions.php':
        // Validar que tiene tag PHP de apertura
        this.assert(
          content.includes('<?php'),
          'functions.php debe empezar con etiqueta PHP',
          'error',
          {
            type: 'missing-php-tag',
            file: fileName,
            fix: 'Agregar <?php al inicio del archivo'
          }
        );

        // Verificar que no termina con ?>
        this.assert(
          !content.trim().endsWith('?>'),
          'functions.php no debe terminar con ?> (WordPress best practice)',
          'warning',
          {
            type: 'unnecessary-closing-tag',
            file: fileName,
            fix: 'Remover ?> del final del archivo'
          }
        );
        break;

      case 'index.php':
        this.assert(
          content.includes('<?php') && content.includes('get_header()'),
          'index.php debe incluir <?php y get_header()',
          'warning',
          {
            type: 'basic-template-structure',
            file: fileName,
            fix: 'Usar estructura básica de template WordPress'
          }
        );
        break;
    }
  }

  /**
   * Validar estructura de componentes
   */
  validateComponentsStructure(themePath) {
    console.log(`      🧩 Validando estructura de componentes...`);

    const componentsPath = path.join(themePath, 'components');

    if (!fs.existsSync(componentsPath)) {
      this.assert(
        false,
        'Directorio components no existe',
        'error',
        {
          type: 'missing-components-directory',
          expectedPath: componentsPath,
          fix: 'Crear directorio components/ para archivos PHP generados'
        }
      );
      return;
    }

    // Obtener componentes existentes
    let componentDirs = [];
    try {
      componentDirs = fs.readdirSync(componentsPath)
        .filter(item => {
          const itemPath = path.join(componentsPath, item);
          return fs.statSync(itemPath).isDirectory();
        });
    } catch (error) {
      this.assert(
        false,
        `Error leyendo directorio components: ${error.message}`,
        'error',
        { type: 'components-directory-read-error', error: error.message }
      );
      return;
    }

    if (componentDirs.length === 0) {
      this.assert(
        false,
        'No se encontraron directorios de componentes',
        'warning',
        {
          type: 'no-component-directories',
          path: componentsPath,
          suggestion: 'Ejecutar npm run wp:generate para generar componentes'
        }
      );
      return;
    }

    // Validar estructura de cada componente
    componentDirs.forEach(componentName => {
      this.validateComponentStructure(componentsPath, componentName);
    });

    console.log(`         • ${componentDirs.length} componentes encontrados`);
  }

  /**
   * Validar estructura de un componente individual
   */
  validateComponentStructure(componentsPath, componentName) {
    const componentPath = path.join(componentsPath, componentName);
    const phpFile = path.join(componentPath, `${componentName}.php`);

    // Archivo PHP debe existir
    this.assert(
      fs.existsSync(phpFile),
      `Componente ${componentName} falta archivo PHP principal`,
      'error',
      {
        type: 'missing-component-php',
        component: componentName,
        expectedFile: `${componentName}.php`,
        expectedPath: phpFile
      }
    );

    if (fs.existsSync(phpFile)) {
      // Validar contenido básico
      const content = fs.readFileSync(phpFile, 'utf8');

      // Debe tener función render esperada
      const expectedFunction = `render_${componentName.replace(/-/g, '_')}`;
      this.assert(
        content.includes(`function ${expectedFunction}`),
        `Componente ${componentName} falta función ${expectedFunction}`,
        'error',
        {
          type: 'missing-render-function',
          component: componentName,
          expectedFunction,
          file: `${componentName}.php`
        }
      );

      // Debe tener header de comentario
      this.assert(
        content.includes('* Auto-generated from Lit component') ||
        content.includes('Component') && content.includes('*'),
        `Componente ${componentName} falta header de documentación`,
        'warning',
        {
          type: 'missing-component-header',
          component: componentName,
          suggestion: 'Agregar comentario de header al componente'
        }
      );
    }
  }

  /**
   * Validar estructura de assets
   */
  validateAssetsStructure(themePath) {
    console.log(`      🎨 Validando estructura de assets...`);

    const assetsPath = path.join(themePath, 'assets');

    if (!fs.existsSync(assetsPath)) {
      this.assert(
        false,
        'Directorio assets faltante',
        'error',
        {
          type: 'missing-assets-directory',
          expectedPath: assetsPath,
          fix: 'Crear directorio assets/ para CSS, JS e imágenes'
        }
      );
      return;
    }

    // Validar subdirectorios de assets
    const assetSubdirs = ['css', 'js'];
    let foundAssets = 0;

    assetSubdirs.forEach(subdir => {
      const subdirPath = path.join(assetsPath, subdir);

      if (fs.existsSync(subdirPath)) {
        foundAssets++;

        // Contar archivos en el subdirectorio
        const files = fs.readdirSync(subdirPath).filter(f => !f.startsWith('.'));
        console.log(`         • ${subdir}/: ${files.length} archivos`);

        if (files.length === 0) {
          this.assert(
            false,
            `Directorio assets/${subdir} está vacío`,
            'warning',
            {
              type: 'empty-assets-directory',
              directory: `assets/${subdir}`,
              suggestion: 'Ejecutar npm run build para generar assets'
            }
          );
        }
      } else {
        this.assert(
          false,
          `Subdirectorio assets/${subdir} faltante`,
          'warning',
          {
            type: 'missing-assets-subdirectory',
            directory: `assets/${subdir}`,
            expectedPath: subdirPath,
            suggestion: 'Ejecutar npm run build para generar assets'
          }
        );
      }
    });

    if (foundAssets === 0) {
      this.assert(
        false,
        'No se encontraron assets CSS/JS',
        'error',
        {
          type: 'no-assets-found',
          suggestion: 'Ejecutar npm run build para generar assets desde Vite'
        }
      );
    }
  }

  /**
   * Validar estructura de includes
   */
  validateIncludesStructure(themePath) {
    const incPath = path.join(themePath, 'inc');

    if (fs.existsSync(incPath)) {
      console.log(`      ⚙️ Validando archivos de inclusión...`);

      const incFiles = fs.readdirSync(incPath)
        .filter(f => f.endsWith('.php'));

      console.log(`         • inc/: ${incFiles.length} archivos PHP`);

      if (incFiles.length === 0) {
        this.assert(
          false,
          'Directorio inc/ existe pero está vacío',
          'warning',
          {
            type: 'empty-inc-directory',
            suggestion: 'Remover directorio inc/ vacío o agregar archivos de inclusión'
          }
        );
      }
    }
  }

  /**
   * Reportar estadísticas de estructura
   */
  reportStructureStats(themePath) {
    const stats = {
      directories: 0,
      phpFiles: 0,
      cssFiles: 0,
      jsFiles: 0,
      components: 0
    };

    // Contar recursivamente
    const countInDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;

      try {
        const items = fs.readdirSync(dirPath);

        items.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            stats.directories++;
            countInDirectory(itemPath);
          } else {
            if (item.endsWith('.php')) stats.phpFiles++;
            if (item.endsWith('.css')) stats.cssFiles++;
            if (item.endsWith('.js')) stats.jsFiles++;
          }
        });
      } catch (error) {
        // Si no se puede leer, no contar
      }
    };

    countInDirectory(themePath);

    // Contar componentes específicamente
    const componentsPath = path.join(themePath, 'components');
    if (fs.existsSync(componentsPath)) {
      try {
        stats.components = fs.readdirSync(componentsPath)
          .filter(item => fs.statSync(path.join(componentsPath, item)).isDirectory())
          .length;
      } catch (error) {
        stats.components = 0;
      }
    }

    console.log(`      📊 Estadísticas de estructura:`);
    console.log(`         • Directorios: ${stats.directories}`);
    console.log(`         • Archivos PHP: ${stats.phpFiles}`);
    console.log(`         • Archivos CSS: ${stats.cssFiles}`);
    console.log(`         • Archivos JS: ${stats.jsFiles}`);
    console.log(`         • Componentes: ${stats.components}`);
  }
}

module.exports = StructureValidator;