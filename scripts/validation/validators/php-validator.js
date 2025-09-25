const ValidatorInterface = require('../core/validator-interface');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PHP Validator
 *
 * Validator moderno para sintaxis PHP que valida:
 * - Sintaxis PHP usando php -l
 * - Patrones problemáticos comunes
 * - Archivos generados por Babel AST
 * - Compliance con WordPress standards
 */
class PHPValidator extends ValidatorInterface {
  constructor(config = {}) {
    super('PHP Validator', config);
    this.requiredSources = []; // No requiere sources específicas
    this.validatedFiles = [];
  }

  /**
   * Ejecuta validaciones PHP
   * @param {Object} sources - Fuentes de datos (no requeridas)
   * @param {Object} context - Contexto ({ themePath?, targetFiles? })
   */
  async validate(sources, context = {}) {
    const { themePath = 'wordpress-output' } = context;

    console.log(`   🐘 Validando sintaxis PHP...`);

    if (!this.checkPHPAvailability()) {
      this.assert(
        false,
        'PHP no está disponible en el sistema',
        'warning',
        {
          type: 'php-unavailable',
          fix: 'Instalar PHP para habilitar validación de sintaxis'
        }
      );
      return;
    }

    // Determinar ruta del tema
    const fullThemePath = this.resolveThemePath(themePath);

    if (!fs.existsSync(fullThemePath)) {
      this.assert(
        false,
        `Directorio del tema no encontrado: ${fullThemePath}`,
        'error',
        { type: 'theme-directory-not-found', path: fullThemePath }
      );
      return;
    }

    // Validar diferentes tipos de archivos PHP
    this.validateMainFiles(fullThemePath);
    this.validatePageTemplates(fullThemePath);
    this.validateComponents(fullThemePath);
    this.validateIncFiles(fullThemePath);

    // Reportar estadísticas
    this.reportValidationStats();
  }

  /**
   * Verifica si PHP está disponible
   */
  checkPHPAvailability() {
    try {
      const phpVersion = execSync('php --version', { encoding: 'utf8' });
      const versionLine = phpVersion.split('\\n')[0];
      console.log(`      🐘 PHP detectado: ${versionLine}`);
      return true;
    } catch (error) {
      console.log(`      ⚠️ PHP no disponible en sistema`);
      return false;
    }
  }

  /**
   * Resolver ruta completa del tema
   */
  resolveThemePath(themePath) {
    if (path.isAbsolute(themePath)) {
      return themePath;
    }

    // Buscar en ubicaciones comunes
    const possiblePaths = [
      path.join(process.cwd(), themePath),
      path.join(process.cwd(), 'wordpress-output', 'toulouse-lautrec'),
      path.join(process.cwd(), 'wordpress-output')
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        // Verificar si es directorio de tema (tiene functions.php o style.css)
        const hasThemeFiles = fs.existsSync(path.join(possiblePath, 'functions.php')) ||
                            fs.existsSync(path.join(possiblePath, 'style.css'));
        if (hasThemeFiles) {
          return possiblePath;
        }

        // Si es directorio padre, buscar subdirectorios de tema
        const subdirs = fs.readdirSync(possiblePath).filter(item => {
          const fullPath = path.join(possiblePath, item);
          return fs.statSync(fullPath).isDirectory();
        });

        for (const subdir of subdirs) {
          const subPath = path.join(possiblePath, subdir);
          const hasThemeFiles = fs.existsSync(path.join(subPath, 'functions.php')) ||
                              fs.existsSync(path.join(subPath, 'style.css'));
          if (hasThemeFiles) {
            return subPath;
          }
        }
      }
    }

    return themePath; // Fallback to original path
  }

  /**
   * Validar archivos principales del tema
   */
  validateMainFiles(themePath) {
    const mainFiles = [
      'functions.php', 'index.php', 'header.php', 'footer.php',
      '404.php', 'search.php', 'front-page.php'
    ];

    console.log(`      📋 Validando archivos principales...`);

    mainFiles.forEach(filename => {
      const filePath = path.join(themePath, filename);
      if (fs.existsSync(filePath)) {
        this.validatePHPFile(filePath, 'main-file');
      }
    });
  }

  /**
   * Validar templates de página
   */
  validatePageTemplates(themePath) {
    console.log(`      📄 Validando templates de página...`);

    if (!fs.existsSync(themePath)) return;

    const pageTemplates = fs.readdirSync(themePath)
      .filter(file => file.startsWith('page-') && file.endsWith('.php'));

    pageTemplates.forEach(template => {
      const filePath = path.join(themePath, template);
      this.validatePHPFile(filePath, 'page-template');
    });

    // También validar single templates
    const singleTemplates = fs.readdirSync(themePath)
      .filter(file => file.startsWith('single-') && file.endsWith('.php'));

    singleTemplates.forEach(template => {
      const filePath = path.join(themePath, template);
      this.validatePHPFile(filePath, 'single-template');
    });
  }

  /**
   * Validar componentes generados
   */
  validateComponents(themePath) {
    console.log(`      🧩 Validando componentes...`);

    const componentsPath = path.join(themePath, 'components');
    if (fs.existsSync(componentsPath)) {
      this.validateDirectory(componentsPath, 'component');
    }
  }

  /**
   * Validar archivos de inclusión
   */
  validateIncFiles(themePath) {
    console.log(`      ⚙️ Validando archivos de inclusión...`);

    const incPath = path.join(themePath, 'inc');
    if (fs.existsSync(incPath)) {
      this.validateDirectory(incPath, 'include-file');
    }
  }

  /**
   * Validar directorio recursivamente
   */
  validateDirectory(directoryPath, fileType = 'php-file') {
    if (!fs.existsSync(directoryPath)) return;

    const items = fs.readdirSync(directoryPath);

    items.forEach(item => {
      const fullPath = path.join(directoryPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.validateDirectory(fullPath, fileType);
      } else if (item.endsWith('.php')) {
        this.validatePHPFile(fullPath, fileType);
      }
    });
  }

  /**
   * Validar archivo PHP específico
   */
  validatePHPFile(filePath, fileType = 'php-file') {
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      // Pre-validación: detectar patrones problemáticos
      const content = fs.readFileSync(filePath, 'utf8');
      const preIssues = this.detectCommonIssues(content);

      if (preIssues.length > 0) {
        preIssues.forEach(issue => {
          this.assert(
            false,
            `Pre-validación: ${issue}`,
            'warning',
            {
              type: 'php-pre-validation',
              file: relativePath,
              fileType,
              issue
            }
          );
        });
      }

      // Validación con php -l
      const result = execSync(`php -l "${filePath}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (result.includes('No syntax errors detected')) {
        this.validatedFiles.push(relativePath);
      } else {
        this.assert(
          false,
          `Error de sintaxis PHP: ${result.trim()}`,
          'error',
          {
            type: 'php-syntax-error',
            file: relativePath,
            fileType,
            phpOutput: result.trim()
          }
        );
      }
    } catch (error) {
      const errorOutput = error.stderr || error.stdout || error.message;
      const parsedError = this.parsePhpError(errorOutput);

      this.assert(
        false,
        `Error de sintaxis PHP: ${parsedError}`,
        'error',
        {
          type: 'php-syntax-error',
          file: relativePath,
          fileType,
          rawError: errorOutput,
          parsedError
        }
      );
    }
  }

  /**
   * Detectar patrones problemáticos comunes
   */
  detectCommonIssues(content) {
    const issues = [];
    const lines = content.split('\\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Detectar comillas no balanceadas en echo
      if (line.includes('echo ') && !line.endsWith(';')) {
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;

        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
          issues.push(`Línea ${lineNum}: Posibles comillas no balanceadas`);
        }
      }

      // Detectar template strings mal convertidos
      if (line.includes('${') && line.includes('}') && line.includes('php echo')) {
        issues.push(`Línea ${lineNum}: Template string posiblemente mal convertido desde Babel AST`);
      }

      // Detectar etiquetas PHP mal cerradas
      if (line.includes('<?php') && !line.includes('?>') && line.length > 50) {
        // Verificar si hay cierre en líneas siguientes (próximas 3 líneas)
        const nextLines = lines.slice(i + 1, i + 4).join(' ');
        if (!nextLines.includes('?>')) {
          issues.push(`Línea ${lineNum}: Etiqueta PHP abierta pero posible falta de cierre`);
        }
      }

      // Detectar uso inseguro de variables
      if (line.includes('echo $') && !line.includes('esc_')) {
        issues.push(`Línea ${lineNum}: Variable sin escape - puede ser vulnerabilidad XSS`);
      }
    }

    return issues;
  }

  /**
   * Parsear errores de PHP para hacerlos legibles
   */
  parsePhpError(errorOutput) {
    const lines = errorOutput.split('\\n');

    for (const line of lines) {
      if (line.includes('PHP Parse error:') || line.includes('PHP Fatal error:')) {
        const match = line.match(/PHP (?:Parse|Fatal) error:\\s*(.+?) in (.+?) on line (\\d+)/);
        if (match) {
          return `Línea ${match[3]}: ${match[1]}`;
        } else {
          return line.replace(/PHP (?:Parse|Fatal) error:\\s*/, '');
        }
      }
    }

    return errorOutput.trim();
  }

  /**
   * Reportar estadísticas de validación
   */
  reportValidationStats() {
    const totalFiles = this.validatedFiles.length;
    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;

    console.log(`      📊 Estadísticas PHP:`);
    console.log(`         • Archivos validados: ${totalFiles}`);
    console.log(`         • Errores: ${errorCount}`);
    console.log(`         • Advertencias: ${warningCount}`);

    if (errorCount === 0) {
      console.log(`         ✅ Todos los archivos PHP tienen sintaxis correcta`);
    } else {
      console.log(`         ❌ ${errorCount} archivos con errores de sintaxis`);
    }
  }

  /**
   * Validar contenido PHP antes de escribir archivo (utilidad estática)
   */
  static validateContent(phpContent, filename = 'temp.php') {
    const tempDir = require('os').tmpdir();
    const tempFile = path.join(tempDir, `wp-gen-${Date.now()}-${filename}`);

    try {
      fs.writeFileSync(tempFile, phpContent);

      const result = execSync(`php -l "${tempFile}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      fs.unlinkSync(tempFile); // Limpiar

      return result.includes('No syntax errors detected');
    } catch (error) {
      // Limpiar archivo en caso de error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      return false;
    }
  }
}

module.exports = PHPValidator;