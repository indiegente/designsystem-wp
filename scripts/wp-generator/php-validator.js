const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PHPValidator - Validación de sintaxis PHP para archivos generados
 * 
 * Valida automáticamente la sintaxis PHP de todos los archivos generados
 * para evitar que los desarrolladores encuentren errores en WordPress.
 */
class PHPValidator {
  constructor(config) {
    this.config = config;
    this.errors = [];
    this.warnings = [];
    this.validatedFiles = [];
  }

  /**
   * Verifica si PHP está disponible en el sistema
   */
  checkPHPAvailability() {
    try {
      const phpVersion = execSync('php --version', { encoding: 'utf8' });
      console.log(`🐘 PHP detectado: ${phpVersion.split('\n')[0]}`);
      return true;
    } catch (error) {
      console.warn('⚠️ PHP no está disponible en el sistema');
      console.warn('💡 Instala PHP para habilitar validación de sintaxis automática');
      return false;
    }
  }

  /**
   * Valida la sintaxis de un archivo PHP específico
   */
  validatePHPFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.addError(filePath, 'Archivo no encontrado');
      return false;
    }

    try {
      // Usar php -l para validar sintaxis
      const result = execSync(`php -l "${filePath}"`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'] 
      });
      
      if (result.includes('No syntax errors detected')) {
        this.addValidatedFile(filePath);
        return true;
      } else {
        this.addError(filePath, result);
        return false;
      }
    } catch (error) {
      // Extraer información útil del error
      const errorOutput = error.stderr || error.stdout || error.message;
      this.addError(filePath, this.parsePhpError(errorOutput));
      return false;
    }
  }

  /**
   * Parsea errores de PHP para hacerlos más legibles
   */
  parsePhpError(errorOutput) {
    const lines = errorOutput.split('\n');
    const errorInfo = {
      message: '',
      line: null,
      context: ''
    };

    for (const line of lines) {
      if (line.includes('PHP Parse error:') || line.includes('PHP Fatal error:')) {
        // Extraer mensaje de error
        const match = line.match(/PHP (?:Parse|Fatal) error:\s*(.+?) in (.+?) on line (\d+)/);
        if (match) {
          errorInfo.message = match[1];
          errorInfo.line = parseInt(match[3]);
        } else {
          errorInfo.message = line.replace(/PHP (?:Parse|Fatal) error:\s*/, '');
        }
      }
    }

    return errorInfo.line 
      ? `Línea ${errorInfo.line}: ${errorInfo.message}`
      : errorInfo.message || errorOutput.trim();
  }

  /**
   * Valida todos los archivos PHP en un directorio
   */
  validateDirectory(directoryPath, recursive = true) {
    if (!fs.existsSync(directoryPath)) {
      console.warn(`⚠️ Directorio no encontrado: ${directoryPath}`);
      return;
    }

    const files = fs.readdirSync(directoryPath);
    
    for (const file of files) {
      const fullPath = path.join(directoryPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && recursive) {
        this.validateDirectory(fullPath, recursive);
      } else if (file.endsWith('.php')) {
        this.validatePHPFile(fullPath);
      }
    }
  }

  /**
   * Valida el tema WordPress completo
   */
  validateWordPressTheme() {
    const themePath = path.join(this.config.outputDir, this.config.themeName);
    
    console.log('🔍 Iniciando validación completa de sintaxis PHP...');
    
    if (!this.checkPHPAvailability()) {
      return false;
    }

    // Resetear contadores
    this.errors = [];
    this.warnings = [];
    this.validatedFiles = [];

    // Validar archivos principales del tema
    const mainFiles = [
      'functions.php',
      'index.php',
      'header.php', 
      'footer.php',
      '404.php',
      'search.php',
      'front-page.php'
    ];

    console.log('📋 Validando archivos principales...');
    for (const file of mainFiles) {
      const filePath = path.join(themePath, file);
      if (fs.existsSync(filePath)) {
        this.validatePHPFile(filePath);
      }
    }

    // Validar templates de página
    console.log('📄 Validando templates de página...');
    const pageTemplates = fs.readdirSync(themePath).filter(file => 
      file.startsWith('page-') && file.endsWith('.php')
    );
    
    for (const template of pageTemplates) {
      this.validatePHPFile(path.join(themePath, template));
    }

    // Validar singles
    console.log('📑 Validando templates single...');
    const singleTemplates = fs.readdirSync(themePath).filter(file => 
      file.startsWith('single-') && file.endsWith('.php')
    );
    
    for (const template of singleTemplates) {
      this.validatePHPFile(path.join(themePath, template));
    }

    // Validar componentes
    console.log('🧩 Validando componentes...');
    const componentsPath = path.join(themePath, 'components');
    if (fs.existsSync(componentsPath)) {
      this.validateDirectory(componentsPath);
    }

    // Validar directorio inc
    console.log('⚙️ Validando archivos de inclusión...');
    const incPath = path.join(themePath, 'inc');
    if (fs.existsSync(incPath)) {
      this.validateDirectory(incPath);
    }

    return this.errors.length === 0;
  }

  /**
   * Valida contenido PHP antes de escribir archivo
   */
  validatePHPContent(phpContent, virtualFilename = 'temp.php') {
    if (!this.checkPHPAvailability()) {
      return true; // Skip validation si PHP no está disponible
    }

    // Pre-validación: detectar patrones problemáticos
    const preValidationIssues = this.detectCommonIssues(phpContent, virtualFilename);
    if (preValidationIssues.length > 0) {
      preValidationIssues.forEach(issue => {
        this.addError(virtualFilename, issue);
      });
      return false;
    }

    // Crear archivo temporal
    const tempDir = require('os').tmpdir();
    const tempFile = path.join(tempDir, `wp-gen-${Date.now()}-${virtualFilename}`);
    
    try {
      fs.writeFileSync(tempFile, phpContent);
      const isValid = this.validatePHPFile(tempFile);
      
      // Limpiar archivo temporal
      fs.unlinkSync(tempFile);
      
      return isValid;
    } catch (error) {
      console.error(`❌ Error validando contenido PHP: ${error.message}`);
      return false;
    }
  }

  /**
   * Detecta patrones problemáticos comunes antes de la validación PHP
   */
  detectCommonIssues(content, filename) {
    const issues = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Detectar PHP anidado en comentarios JavaScript
      if (line.includes('//') && line.includes('<?php')) {
        issues.push(`Línea ${lineNum}: PHP anidado en comentario JavaScript detectado. Esto puede causar problemas de parsing.`);
      }
      
      // Detectar comillas no balanceadas en echo statements
      const echoMatches = line.match(/echo\s+['"]/g);
      if (echoMatches) {
        // Ignorar líneas que terminan con . "\n" ya que son concatenaciones válidas
        if (!line.match(/\.\s*['"]\s*\\n\s*['"]\s*;?\s*$/)) {
          const singleQuotes = (line.match(/'/g) || []).length;
          const doubleQuotes = (line.match(/"/g) || []).length;
          if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
            issues.push(`Línea ${lineNum}: Posibles comillas no balanceadas en echo statement`);
          }
        }
      }
      
      // Detectar template strings mal formateados en concatenación
      if (line.includes('${') && line.includes("'")) {
        issues.push(`Línea ${lineNum}: Template string posiblemente mal formateado en contexto PHP`);
      }
      
      // Detectar etiquetas PHP incompletas
      if (line.includes('<?php') && !line.includes('?>') && !lines.slice(i + 1).some(l => l.includes('?>'))) {
        issues.push(`Línea ${lineNum}: Etiqueta PHP abierta pero no cerrada en el archivo`);
      }
      
      // Detectar uso de variables globales sin verificación
      if (line.includes('->')) {
        const methodCallMatch = line.match(/\$(\w+)->/);
        if (methodCallMatch) {
          const varName = methodCallMatch[1];
          // Buscar declaración global de la variable en líneas anteriores
          for (let j = Math.max(0, i - 10); j < i; j++) {
            if (lines[j].includes(`global $${varName}`)) {
              // Variable es global, verificar si hay validación
              if (!line.includes('if (') && !line.includes(`isset($${varName})`)) {
                issues.push(`Línea ${lineNum}: Uso de variable global \$${varName} sin verificar si existe (posible null pointer). Considera usar: if (\$${varName} && method_exists(\$${varName}, 'method'))`);
              }
              break;
            }
          }
        }
      }
    }
    
    return issues;
  }

  /**
   * Agrega un error de validación
   */
  addError(filePath, errorMessage) {
    this.errors.push({
      file: path.relative(this.config.outputDir, filePath),
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Agrega un archivo validado exitosamente
   */
  addValidatedFile(filePath) {
    this.validatedFiles.push({
      file: path.relative(this.config.outputDir, filePath),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Genera reporte de validación
   */
  generateValidationReport() {
    const totalFiles = this.validatedFiles.length + this.errors.length;
    const successRate = totalFiles > 0 ? ((this.validatedFiles.length / totalFiles) * 100).toFixed(1) : 0;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalFiles,
        valid: this.validatedFiles.length,
        errors: this.errors.length,
        successRate: `${successRate}%`
      },
      validFiles: this.validatedFiles,
      errors: this.errors
    };

    return report;
  }

  /**
   * Imprime reporte de validación en consola
   */
  printValidationReport() {
    const report = this.generateValidationReport();
    
    console.log('\n📊 Reporte de Validación PHP');
    console.log('═'.repeat(50));
    console.log(`📁 Archivos totales: ${report.summary.total}`);
    console.log(`✅ Archivos válidos: ${report.summary.valid}`);
    console.log(`❌ Errores encontrados: ${report.summary.errors}`);
    console.log(`📈 Tasa de éxito: ${report.summary.successRate}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errores de Sintaxis PHP:');
      console.log('─'.repeat(50));
      
      for (const error of report.errors) {
        console.log(`📄 ${error.file}`);
        console.log(`   └─ ${error.error}`);
        console.log('');
      }
      
      console.log('💡 Consejos para corregir errores:');
      console.log('   • Verifica comillas balanceadas (\' y ")');
      console.log('   • Revisa puntos y comas faltantes');
      console.log('   • Confirma llaves de apertura/cierre ({ })');
      console.log('   • Valida sintaxis de arrays y objetos');
    } else {
      console.log('\n🎉 ¡Todos los archivos PHP tienen sintaxis correcta!');
    }
  }

  /**
   * Guarda reporte de validación en archivo JSON
   */
  saveValidationReport() {
    const report = this.generateValidationReport();
    const reportPath = path.join(this.config.outputDir, 'php-validation-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado en: ${reportPath}`);
  }

  /**
   * Hook para validar antes de escribir archivo
   */
  static createValidationHook(validator) {
    return {
      beforeFileWrite: (filePath, content) => {
        if (filePath.endsWith('.php')) {
          const filename = path.basename(filePath);
          if (!validator.validatePHPContent(content, filename)) {
            throw new Error(`❌ Error de sintaxis PHP en ${filename}. Ver reporte para detalles.`);
          }
        }
        return content;
      }
    };
  }

  /**
   * Modo interactivo para corrección de errores
   */
  async runInteractiveValidation() {
    console.log('🔍 Iniciando validación interactiva...');
    
    if (!this.validateWordPressTheme()) {
      console.log('\n🛠️ ¿Deseas ver sugerencias de corrección? (Los errores ya están listados arriba)');
      console.log('💡 Modo interactivo: Revisa cada error y sus posibles soluciones');
      
      for (const error of this.errors) {
        console.log(`\n📄 Archivo: ${error.file}`);
        console.log(`❌ Error: ${error.error}`);
        console.log('🔧 Sugerencias:');
        
        if (error.error.includes('unexpected')) {
          console.log('   • Revisa comillas sin escapar o mal balanceadas');
          console.log('   • Verifica puntos y comas faltantes antes de la línea del error');
        }
        
        if (error.error.includes('syntax error')) {
          console.log('   • Confirma que todas las llaves { } estén balanceadas');
          console.log('   • Revisa la sintaxis de arrays: array() o []');
        }
        
        if (error.error.includes('unexpected identifier')) {
          console.log('   • Problema común: comillas simples sin escapar dentro de strings');
          console.log('   • Solución: usar " en lugar de \' o escapar con \\\'');
        }
      }
    }
    
    this.printValidationReport();
    this.saveValidationReport();
  }
}

module.exports = PHPValidator;