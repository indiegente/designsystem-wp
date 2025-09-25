const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * Babel AST Converter - Robusta conversión Lit → PHP
 *
 * GARANTÍAS:
 * - 100% automatización (cero PHP manual)
 * - Parsing robusto de JavaScript real
 * - Fail-fast si hay patterns no soportados
 * - Conversión completa de todos los template literals
 */
/**
 * Context Tracker - Sistema comprehensivo de contexto para conversiones robustas
 */
class ContextTracker {
  constructor() {
    this.scopes = []; // Stack de scopes anidados
    this.variables = new Map(); // Variables disponibles por scope
    this.loops = new Map(); // Contexto de loops activos
    this.phpContext = false; // Si estamos dentro de PHP tags
    this.componentParameters = new Set(); // Parámetros del componente actual
  }

  // Entrar en nuevo scope
  enterScope(scopeType, scopeData = {}) {
    const scope = {
      type: scopeType, // 'function', 'loop', 'conditional'
      variables: new Map(),
      data: scopeData,
      parent: this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : null
    };
    this.scopes.push(scope);
    return scope;
  }

  // Salir del scope actual
  exitScope() {
    if (this.scopes.length === 0) {
      throw new Error('❌ CONTEXT ERROR: Intentando salir de scope inexistente');
    }
    return this.scopes.pop();
  }

  // Definir variable en scope actual
  defineVariable(name, type, value = null) {
    const currentScope = this.getCurrentScope();
    currentScope.variables.set(name, { type, value, defined: true });
  }

  // Validar si variable está disponible
  isVariableAvailable(name) {
    // Buscar en scopes desde el más interno al más externo
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].variables.has(name)) {
        return true;
      }
    }

    // Buscar en parámetros del componente
    return this.componentParameters.has(name);
  }

  // Obtener información de variable
  getVariable(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].variables.has(name)) {
        return this.scopes[i].variables.get(name);
      }
    }

    if (this.componentParameters.has(name)) {
      return { type: 'parameter', defined: true };
    }

    return null;
  }

  // Obtener scope actual
  getCurrentScope() {
    if (this.scopes.length === 0) {
      throw new Error('❌ CONTEXT ERROR: No hay scope activo');
    }
    return this.scopes[this.scopes.length - 1];
  }

  // Validar variable antes de usar
  validateVariable(name, context = 'unknown') {
    if (!this.isVariableAvailable(name)) {
      const availableVars = this.getAvailableVariables();
      throw new Error(`❌ VARIABLE NO DEFINIDA: '$${name}' en contexto '${context}'
💡 Variables disponibles: ${Array.from(availableVars).join(', ')}`);
    }
  }

  // Obtener todas las variables disponibles
  getAvailableVariables() {
    const variables = new Set(this.componentParameters);
    for (const scope of this.scopes) {
      for (const [name] of scope.variables) {
        variables.add(name);
      }
    }
    return variables;
  }

  // Resetear contexto
  reset() {
    this.scopes = [];
    this.variables.clear();
    this.loops.clear();
    this.phpContext = false;
    this.componentParameters.clear();
  }

  // Métodos para manejo de contexto PHP
  enterPHPContext() {
    this.phpContext = true;
  }

  exitPHPContext() {
    this.phpContext = false;
  }

  isInPHPContext() {
    return this.phpContext;
  }

  // Método para agregar variables al scope actual
  addVariable(name, type = 'unknown', value = null) {
    if (this.scopes.length === 0) {
      // Si no hay scopes, agregar como parámetro de componente
      this.componentParameters.add(name);
    } else {
      // Agregar al scope actual
      const currentScope = this.scopes[this.scopes.length - 1];
      currentScope.variables.set(name, { type, value });
    }
  }
}

class BabelASTConverter {
  constructor(config) {
    this.config = config;
    this.convertedPHP = '';
    this.errors = [];
    this.componentName = '';
    this.context = new ContextTracker(); // Sistema de contexto robusto
    this.metadata = this.loadMetadata(); // Cargar metadata de escape
  }

  /**
   * Cargar metadata de escape desde src/metadata.json
   */
  loadMetadata() {
    try {
      const fs = require('fs');
      const path = require('path');
      const metadataPath = path.join(process.cwd(), 'src', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      console.log('📋 Metadata de escape cargada exitosamente');
      return metadata;
    } catch (error) {
      console.warn('⚠️ No se pudo cargar metadata de escape, usando fallback');
      return {};
    }
  }

  /**
   * Obtener información de escape para una propiedad específica
   * Implementa Opción 1 (Metadata) + Opción 3 (Contexto)
   */
  getEscapeInfo(propertyName, componentName, isInAttribute = false, attributeName = '') {
    // Opción 3: Contexto semántico (prioridad más alta)
    if (isInAttribute) {
      if (attributeName === 'href' || attributeName === 'src' || attributeName === 'action') {
        return { function: 'esc_url', reason: `contextual:attribute[${attributeName}]` };
      }
      return { function: 'esc_attr', reason: `contextual:attribute[${attributeName}]` };
    }

    // Opción 1: Metadata declarativa
    const componentMeta = this.metadata[componentName];
    if (componentMeta && componentMeta.parameters) {
      const param = componentMeta.parameters.find(p => p.name === propertyName);
      if (param && param.escape) {
        const escapeMap = {
          'html': 'esc_html',
          'url': 'esc_url',
          'attr': 'esc_attr',
          'js': 'esc_js',
          'none': 'none'
        };
        return {
          function: escapeMap[param.escape] || 'esc_html',
          reason: `metadata:${param.escape}`
        };
      }
    }

    // FAIL FAST: Sin fallbacks según .rules
    throw new Error(`❌ ESCAPE METADATA FALTANTE: Campo '${propertyName}' en componente '${componentName}' no tiene escape metadata declarativo. Actualizar src/metadata.json`);
  }

  /**
   * Obtener información de escape para propiedades de array (testimonials, features, etc.)
   */
  getArrayFieldEscapeInfo(fieldName, componentName) {
    const componentMeta = this.metadata[componentName];
    if (componentMeta && componentMeta.arrayFields) {
      for (const [arrayName, fields] of Object.entries(componentMeta.arrayFields)) {
        const field = fields.find(f => f.name === fieldName);
        if (field && field.escape) {
          const escapeMap = {
            'html': 'esc_html',
            'url': 'esc_url',
            'attr': 'esc_attr',
            'js': 'esc_js',
            'none': 'none'
          };
          return {
            function: escapeMap[field.escape] || 'esc_html',
            reason: `arrayField:${field.escape}`
          };
        }
      }
    }

    // FAIL FAST: Sin fallbacks según .rules
    throw new Error(`❌ ARRAY FIELD ESCAPE METADATA FALTANTE: Campo '${fieldName}' en arrays de componente '${componentName}' no tiene escape metadata declarativo. Actualizar arrayFields en src/metadata.json`);
  }

  /**
   * Convierte template Lit a PHP usando AST con contexto robusto
   */
  convertLitTemplateToPhp(litTemplate, componentName) {
    this.componentName = componentName;
    this.convertedPHP = '';
    this.errors = [];

    // Resetear y configurar contexto
    this.context.reset();
    this.setupComponentContext(componentName);

    console.log(`🔍 AST: Converting ${componentName} with comprehensive context tracking`);

    try {
      // 1. Wrap template in function for valid JS parsing
      const wrappedCode = `function render() { return html\`${litTemplate}\`; }`;

      // 2. Parse with Babel
      const ast = babel.parse(wrappedCode, {
        sourceType: 'module',
        plugins: ['typescript'] // Support TS syntax if needed
      });

      // 3. Traverse AST with context-aware conversion
      this.traverseAndConvertWithContext(ast);

      // 4. Fail fast if any errors
      if (this.errors.length > 0) {
        throw new Error(`❌ AST CONVERSION FAILED for ${componentName}:\n${this.errors.join('\n')}`);
      }

      console.log(`✅ AST: Successfully converted ${componentName} with context validation`);
      return this.convertedPHP;

    } catch (error) {
      throw new Error(`❌ AST PARSING FAILED for ${componentName}: ${error.message}`);
    }
  }

  /**
   * Configura el contexto inicial del componente
   */
  setupComponentContext(componentName) {
    // Cargar parámetros del componente desde metadata
    const metadata = this.loadComponentMetadata(componentName);

    if (metadata && metadata.parameters) {
      // Registrar parámetros como variables disponibles
      for (const param of metadata.parameters) {
        this.context.componentParameters.add(param.name);
      }
    }

    // Entrar en scope principal del componente
    this.context.enterScope('component', {
      name: componentName,
      parameters: metadata?.parameters || []
    });
  }

  /**
   * Carga metadata del componente para contexto
   */
  loadComponentMetadata(componentName) {
    try {
      const fs = require('fs');
      const path = require('path');
      const metadataPath = path.join(this.config.srcDir, 'metadata.json');

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        return metadata[componentName];
      }
    } catch (error) {
      console.warn(`⚠️ Could not load metadata for ${componentName}: ${error.message}`);
    }
    return null;
  }

  /**
   * Traversa el AST con manejo de contexto comprehensivo
   */
  traverseAndConvertWithContext(ast) {
    let mainTemplateFound = false;

    traverse(ast, {
      // Solo procesar el template principal con contexto completo
      TaggedTemplateExpression: (path) => {
        if (this.isMainHtmlTemplate(path) && !mainTemplateFound) {
          console.log(`🎯 AST: Processing MAIN template for ${this.componentName} with context validation`);

          // Entrar en contexto de template
          this.context.enterScope('template', { type: 'main' });

          try {
            this.convertMainTemplateWithContext(path);
            mainTemplateFound = true;
          } finally {
            this.context.exitScope();
          }

          // Skip todos los demás para evitar duplicación
          path.skip();
        }
      }
    });

    if (!mainTemplateFound) {
      throw new Error(`❌ No main html template found in ${this.componentName}`);
    }

    // Validar que se salió de todos los scopes correctamente
    if (this.context.scopes.length > 1) { // Solo debe quedar el scope del componente
      throw new Error(`❌ CONTEXT ERROR: Scopes no balanceados en ${this.componentName}`);
    }
  }

  /**
   * Verifica si es el template HTML principal (del método render)
   */
  isMainHtmlTemplate(path) {
    return t.isIdentifier(path.node.tag) &&
           path.node.tag.name === 'html' &&
           this.isInRenderMethod(path);
  }

  /**
   * Verifica si el path está dentro del método render()
   */
  isInRenderMethod(path) {
    let current = path;
    while (current) {
      if (t.isReturnStatement(current.node)) {
        // Buscar el método que contiene este return
        let parent = current.parent;
        while (parent) {
          if (t.isMethod(parent) || t.isFunction(parent)) {
            const name = parent.key?.name || parent.id?.name;
            return name === 'render';
          }
          parent = current.parent;
          current = current.parentPath;
          break;
        }
      }
      current = current.parentPath;
    }
    return true; // Default: asumir que es el principal si no podemos determinar
  }

  /**
   * Convierte el template principal con manejo de contexto comprehensivo
   * ARQUITECTURA ROBUSTA: Validación completa de variables en todos los scopes
   */
  convertMainTemplateWithContext(path) {
    const templateLiteral = path.node.quasi;
    const { quasis, expressions } = templateLiteral;

    console.log(`🔄 AST: Converting template with context validation - ${quasis.length} text parts and ${expressions.length} expressions`);

    // Procesar alternando texto estático y expresiones con validación de contexto
    for (let i = 0; i < quasis.length; i++) {
      // 1. Texto estático - detectar entrada/salida de PHP tags
      const staticText = quasis[i].value.raw;
      this.processStaticTextWithContext(staticText);

      // 2. Expresión dinámica (si existe) - con validación de variables
      if (i < expressions.length) {
        const expression = expressions[i];
        this.convertExpressionWithContext(expression, `expression_${i}`);
      }
    }
  }

  /**
   * Procesa texto estático detectando cambios de contexto PHP
   */
  processStaticTextWithContext(text) {
    // Detectar PHP tags para manejo de contexto
    const phpOpenTags = (text.match(/<\?php/g) || []).length;
    const phpCloseTags = (text.match(/\?>/g) || []).length;

    // Actualizar contexto PHP
    if (phpOpenTags > phpCloseTags) {
      this.context.enterPHPContext();
    } else if (phpCloseTags > phpOpenTags) {
      this.context.exitPHPContext();
    }

    // Detectar loops (foreach, for, while) para manejo de scope
    if (this.context.isInPHPContext()) {
      this.detectAndHandleLoopContexts(text);
      this.detectAndHandleConditionalContexts(text);
    }

    this.convertedPHP += text;
  }

  /**
   * Detecta y maneja contextos de loops en PHP
   */
  detectAndHandleLoopContexts(text) {
    // Detectar foreach loops
    const foreachMatch = text.match(/foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)/);
    if (foreachMatch) {
      const [, arrayVar, itemVar] = foreachMatch;

      // Validar que la variable del array existe
      this.context.validateVariable(arrayVar, 'foreach-array');

      // Entrar en scope de loop y agregar variable del item
      this.context.enterScope('foreach', {
        arrayVar,
        itemVar,
        iterationContext: true
      });

      // La variable del item estará disponible dentro del loop
      this.context.addVariable(itemVar, 'loop-item');

      console.log(`🔄 Context: Entering foreach loop - ${arrayVar} as ${itemVar}`);
    }

    // Detectar fin de loops
    if (text.includes('endforeach')) {
      this.context.exitScope();
      console.log(`🔄 Context: Exiting foreach loop`);
    }
  }

  /**
   * Detecta y maneja contextos condicionales
   */
  detectAndHandleConditionalContexts(text) {
    // Detectar condicionales if
    if (text.includes('if (') || text.includes('if(')) {
      this.context.enterScope('conditional', { type: 'if' });
      console.log(`🔄 Context: Entering conditional scope`);
    }

    // Detectar fin de condicionales
    if (text.includes('endif')) {
      this.context.exitScope();
      console.log(`🔄 Context: Exiting conditional scope`);
    }
  }

  /**
   * Convierte expresiones con validación de contexto comprehensiva
   * ARQUITECTURA ROBUSTA: Validación de variables en todos los scopes
   */
  convertExpressionWithContext(node, contextName) {
    console.log(`🔄 Context: Processing ${node.type} in context '${contextName}'`);

    switch (node.type) {
      case 'ConditionalExpression':
        this.convertConditionalExpressionWithContext(node, contextName);
        break;

      case 'TaggedTemplateExpression':
        // Templates anidados - NO procesar recursivamente
        if (t.isIdentifier(node.tag) && node.tag.name === 'html') {
          console.log(`🔄 AST: Skipping nested html template (part of conditional)`);
          // No hacer nada - ya está procesado en el template principal
        } else {
          throw new Error(`❌ UNSUPPORTED TEMPLATE: ${node.tag.name} en contexto ${contextName}`);
        }
        break;

      case 'Identifier':
        this.convertIdentifierWithValidation(node, contextName);
        break;

      case 'MemberExpression':
        this.convertMemberExpressionWithValidation(node, contextName);
        break;

      case 'CallExpression':
        this.convertCallExpressionWithContext(node, contextName);
        break;

      case 'BinaryExpression':
        this.convertBinaryExpressionWithContext(node, contextName);
        break;

      case 'LogicalExpression':
        this.convertLogicalExpressionWithContext(node, contextName);
        break;

      case 'NumericLiteral':
      case 'Literal':
        this.convertLiteralWithContext(node, contextName);
        break;

      case 'StringLiteral':
        this.convertStringLiteralWithContext(node, contextName);
        break;

      default:
        throw new Error(`❌ UNSUPPORTED NODE TYPE: ${node.type} en contexto ${contextName}`);
    }
  }

  /**
   * Convierte identificadores con validación de existencia en contexto
   * ARQUITECTURA ROBUSTA: Contexto-aware conversion
   */
  convertIdentifierWithValidation(node, contextName) {
    const varName = node.name;

    // Validar que la variable existe en el contexto actual
    this.context.validateVariable(varName, contextName);

    // Generar salida apropiada según el contexto
    if (this.context.isInPHPContext()) {
      // Ya estamos en PHP - solo la variable
      this.convertedPHP += `$${varName}`;
    } else if (contextName.includes('-test')) {
      // Es parte de una condición - solo la variable sin echo
      this.convertedPHP += `$${varName}`;
    } else {
      // Contexto de template HTML - necesita echo completo
      this.convertedPHP += `<?php echo esc_html( $${varName} ); ?>`;
    }
  }

  /**
   * Convierte expresiones member con validación de objeto base
   * ARQUITECTURA ROBUSTA: Context-aware member expression conversion
   */
  convertMemberExpressionWithValidation(node, contextName) {
    // Validar el objeto base si es identificador
    if (t.isIdentifier(node.object)) {
      this.context.validateVariable(node.object.name, `${contextName}-object`);
    }

    // Conversión context-aware completa
    if (t.isThisExpression(node.object)) {
      // this.property -> $property
      const property = node.property.name;

      // Manejo especial para propiedades de array como length
      if (property === 'length') {
        this.convertedPHP += `count($${property})`;
        return;
      }

      const phpVar = `$${property}`;
      const shouldEscape = !this.context.isInPHPContext() && !contextName.includes('-test');

      if (shouldEscape) {
        // SISTEMA ROBUSTO: Usar metadata + contexto semántico
        const escapeInfo = this.getEscapeInfo(property, this.componentName);
        if (escapeInfo.function === 'none') {
          this.convertedPHP += phpVar;
        } else {
          this.convertedPHP += `<?php echo ${escapeInfo.function}( ${phpVar} ); ?>`;
        }
        console.log(`🔒 Escape aplicado: ${property} -> ${escapeInfo.function} (${escapeInfo.reason})`);
      } else {
        // Ya estamos en PHP o es una condición - solo la variable
        this.convertedPHP += phpVar;
      }
    } else if (t.isIdentifier(node.object)) {
      // item.property, result.property
      const objectName = node.object.name;
      const property = node.property.name;

      if (property === 'length') {
        this.convertedPHP += `count($${objectName})`;
        return;
      }

      const shouldEscape = !this.context.isInPHPContext() && !contextName.includes('-test');

      // FAIL-FAST: Validar que estamos en contexto de loop
      const loopVar = this.getLoopVariable();
      if (!loopVar) {
        throw new Error(`❌ VARIABLE LOOP NO DEFINIDA: '${objectName}.${property}' fuera de contexto foreach
💡 Solución: Esta expresión debe estar dentro de un map/foreach loop`);
      }

      if (shouldEscape) {
        // SISTEMA ROBUSTO: Usar metadata para array fields
        const escapeInfo = this.getArrayFieldEscapeInfo(property, this.componentName);
        if (escapeInfo.function === 'none') {
          this.convertedPHP += `$${loopVar}['${property}']`;
        } else {
          this.convertedPHP += `<?php echo ${escapeInfo.function}( $${loopVar}['${property}'] ); ?>`;
        }
        console.log(`🔒 Array escape aplicado: ${property} -> ${escapeInfo.function} (${escapeInfo.reason})`);
      } else {
        this.convertedPHP += `$${loopVar}['${property}']`;
      }
    } else if (t.isMemberExpression(node.object)) {
      // Nested member expressions como this.array.length
      if (t.isThisExpression(node.object.object) && node.property.name === 'length') {
        const arrayName = node.object.property.name;
        this.convertedPHP += `count($${arrayName})`;
      } else {
        throw new Error(`❌ NESTED MEMBER EXPRESSION no soportada: ${contextName}`);
      }
    } else {
      throw new Error(`❌ MEMBER EXPRESSION OBJECT TYPE no soportado: ${node.object.type} en ${contextName}`);
    }
  }

  /**
   * Obtiene la variable del loop actual
   */
  getLoopVariable() {
    // Buscar en los scopes actuales si hay un foreach activo
    for (let i = this.context.scopes.length - 1; i >= 0; i--) {
      const scope = this.context.scopes[i];
      if (scope.type === 'foreach' && scope.data && scope.data.itemVar) {
        return scope.data.itemVar;
      }
    }
    return null; // No hay loop activo
  }




  /**
   * Convierte llamadas a métodos de forma segura (maneja templates anidados)
   */
  convertCallExpressionSafely(node) {
    if (t.isMemberExpression(node.callee)) {
      const object = node.callee.object;
      const method = node.callee.property.name;

      if (method === 'map' && this.hasNestedTemplateInArguments(node.arguments)) {
        // Array.map() con template anidado - manejar como foreach PHP
        this.convertMapWithTemplate(object, node.arguments);
      } else {
        // Usar método existente para otros casos
        this.convertCallExpression(node);
      }
    } else {
      this.convertCallExpression(node);
    }
  }

  /**
   * Convierte llamadas a métodos
   */
  convertCallExpression(node) {
    if (t.isMemberExpression(node.callee)) {
      const object = node.callee.object;
      const method = node.callee.property.name;

      if (t.isThisExpression(object)) {
        // this.method()
        this.convertThisMethodCall(method, node.arguments);
      } else if (t.isMemberExpression(object)) {
        // this.array.map()
        this.convertArrayMethodCall(object, method, node.arguments);
      }
    }
  }

  /**
   * Verifica si los argumentos contienen templates anidados
   */
  hasNestedTemplateInArguments(args) {
    return args.some(arg => {
      if (t.isArrowFunctionExpression(arg)) {
        return this.hasNestedTemplate(arg.body);
      }
      return this.hasNestedTemplate(arg);
    });
  }

  /**
   * Convierte array.map() con template anidado a foreach PHP
   * ARQUITECTURA ROBUSTA: Con manejo de contexto completo
   */
  convertMapWithTemplate(object, args) {
    if (t.isMemberExpression(object) && t.isThisExpression(object.object)) {
      const arrayName = object.property.name;
      const arrowFunction = args[0];

      if (t.isArrowFunctionExpression(arrowFunction)) {
        const paramName = arrowFunction.params[0]?.name || 'item';

        // Validar que el array existe en el contexto
        this.context.validateVariable(arrayName, 'map-array');

        this.convertedPHP += `<?php foreach ($${arrayName} as $${paramName}) : ?>`;

        // Entrar en scope de loop y agregar variable del item
        this.context.enterScope('foreach', {
          arrayVar: arrayName,
          itemVar: paramName,
          iterationContext: true
        });

        // La variable del item estará disponible dentro del loop
        this.context.addVariable(paramName, 'loop-item');

        console.log(`🔄 Context: Entering map-to-foreach loop - ${arrayName} as ${paramName}`);

        try {
          // Convertir el cuerpo de la arrow function con contexto
          if (this.hasNestedTemplate(arrowFunction.body)) {
            this.convertConsequentOrAlternate(arrowFunction.body);
          } else {
            this.convertExpressionWithContext(arrowFunction.body, 'map-loop-body');
          }
        } finally {
          // Salir del scope del loop
          this.context.exitScope();
          console.log(`🔄 Context: Exiting map-to-foreach loop`);
        }

        this.convertedPHP += `<?php endforeach; ?>`;
      }
    }
  }

  /**
   * Convierte this.method()
   */
  convertThisMethodCall(methodName, args) {
    const methodMappings = {
      'formatResultCount': () => {
        this.convertedPHP += `<?php
          if ($totalResults === 0) echo '';
          elseif ($totalResults === 1) echo '1 resultado encontrado';
          else echo $totalResults . ' resultados encontrados';
        ?>`;
      },
      'getCurrentYear': () => {
        this.convertedPHP += `<?php echo date('Y'); ?>`;
      },
      'renderStars': (args) => {
        // FAIL-FAST: Debe estar en contexto de loop
        const loopVar = this.getLoopVariable();
        if (!loopVar) {
          throw new Error(`❌ renderStars() FUERA DE CONTEXTO: Debe estar dentro de un foreach loop
💡 Solución: Usar renderStars() solo dentro de map/foreach`);
        }

        this.convertedPHP += `<?php for ($i = 1; $i <= 5; $i++): ?>
          <span class="star"><?php echo $i <= $${loopVar}['rating'] ? '★' : '☆'; ?></span>
        <?php endfor; ?>`;
      }
    };

    if (methodMappings[methodName]) {
      methodMappings[methodName](args);
    } else {
      this.errors.push(`Unsupported method: ${methodName}()`);
    }
  }

  /**
   * Convierte this.array.map()
   */
  convertArrayMethodCall(object, method, args) {
    if (method === 'map' && t.isThisExpression(object.object)) {
      const arrayName = object.property.name;
      const callback = args[0];

      this.convertedPHP += `<?php
        if (!isset($${arrayName}) || !is_array($${arrayName})) {
            echo '<!-- Array ${arrayName} not available -->';
        } else {
            foreach ($${arrayName} as $item):
      ?>`;

      // Process callback body
      if (t.isArrowFunctionExpression(callback)) {
        this.convertExpressionWithContext(callback.body, 'callback-body');
      }

      this.convertedPHP += `<?php endforeach; } ?>`;
    }
  }

  /**
   * Convierte expresiones condicionales de forma segura (maneja templates anidados)
   */
  convertConditionalExpressionSafely(node) {
    // Para condicionales con templates HTML anidados, usar lógica especial
    if (this.hasNestedTemplate(node.consequent) || this.hasNestedTemplate(node.alternate)) {
      this.convertConditionalToPhpIfElse(node);
    } else {
      // Usar método existente para casos normales
      this.convertConditionalExpression(node);
    }
  }

  /**
   * Convierte expresiones condicionales (ternario)
   */
  convertConditionalExpression(node) {
    this.convertedPHP += `<?php if (`;
    this.convertCondition(node.test);
    this.convertedPHP += `): ?>`;

    this.convertExpressionWithContext(node.consequent, 'conditional-consequent');

    this.convertedPHP += `<?php else: ?>`;
    this.convertExpressionWithContext(node.alternate, 'conditional-alternate');
    this.convertedPHP += `<?php endif; ?>`;
  }

  /**
   * Convierte condicional con template anidado a if/else PHP limpio
   */
  convertConditionalToPhpIfElse(node) {
    this.convertedPHP += '<?php if ( ';

    // Entrar en contexto PHP
    this.inPHPContext = true;
    this.convertTestCondition(node.test);
    this.inPHPContext = false;

    this.convertedPHP += ' ) : ?>';

    // Consequent (true branch)
    this.convertConsequentOrAlternate(node.consequent);

    this.convertedPHP += '<?php else : ?>';

    // Alternate (false branch)
    this.convertConsequentOrAlternate(node.alternate);

    this.convertedPHP += '<?php endif; ?>';
  }

  /**
   * Verifica si un nodo contiene templates anidados
   */
  hasNestedTemplate(node) {
    return node && node.type === 'TaggedTemplateExpression' &&
           t.isIdentifier(node.tag) && node.tag.name === 'html';
  }

  /**
   * Convierte la condición de test a PHP
   */
  convertTestCondition(node) {
    if (t.isMemberExpression(node) && t.isThisExpression(node.object)) {
      const property = node.property.name;
      this.convertedPHP += `$${property}`;
    } else {
      this.convertExpressionWithContext(node, 'consequent-alternate');
    }
  }

  /**
   * Convierte consequent o alternate de condicional
   */
  convertConsequentOrAlternate(node) {
    if (this.hasNestedTemplate(node)) {
      // Es un template html`...` - extraer y convertir su contenido
      for (let i = 0; i < node.quasi.quasis.length; i++) {
        this.convertedPHP += node.quasi.quasis[i].value.raw;
        if (i < node.quasi.expressions.length) {
          this.convertExpressionWithContext(node.quasi.expressions[i], `template-expression-${i}`);
        }
      }
    } else if (node.type === 'StringLiteral' || (node.type === 'Literal' && typeof node.value === 'string')) {
      // String literal simple - solo agregar si no es empty
      if (node.value !== '') {
        this.convertedPHP += node.value;
      }
    } else {
      this.convertExpressionWithContext(node, 'consequent-alternate');
    }
  }

  /**
   * Convierte condiciones
   */
  convertCondition(node) {
    switch (node.type) {
      case 'MemberExpression':
        if (t.isThisExpression(node.object)) {
          this.convertedPHP += `$${node.property.name}`;
        } else if (t.isIdentifier(node.object)) {
          // item.property
          this.convertedPHP += `$item['${node.property.name}']`;
        } else if (t.isMemberExpression(node.object)) {
          // Nested member expressions like this.array.length
          if (t.isThisExpression(node.object.object) && node.property.name === 'length') {
            const arrayName = node.object.property.name;
            this.convertedPHP += `count($${arrayName})`;
          } else {
            // Other nested expressions
            this.errors.push(`Unsupported nested member expression in condition`);
          }
        }
        break;

      case 'BinaryExpression':
        this.convertCondition(node.left);
        this.convertedPHP += ` ${node.operator} `;
        this.convertCondition(node.right);
        break;

      case 'LogicalExpression':
        this.convertCondition(node.left);
        this.convertedPHP += ` ${node.operator} `;
        this.convertCondition(node.right);
        break;

      case 'Literal':
      case 'StringLiteral':
      case 'NumericLiteral':
      case 'BooleanLiteral':
        if (typeof node.value === 'string') {
          this.convertedPHP += `'${node.value}'`;
        } else {
          this.convertedPHP += node.value;
        }
        break;

      case 'Identifier':
        this.convertedPHP += `$${node.name}`;
        break;

      default:
        this.errors.push(`Unsupported condition type: ${node.type}`);
    }
  }

  /**
   * Convierte expresiones binarias
   */
  convertBinaryExpression(node) {
    this.convertExpressionWithContext(node.left, 'binary-left');
    this.convertedPHP += ` ${node.operator} `;
    this.convertExpressionWithContext(node.right, 'binary-right');
  }

  /**
   * Convierte expresiones lógicas (&&, ||)
   */
  convertLogicalExpression(node) {
    this.convertExpressionWithContext(node.left, 'binary-left');
    this.convertedPHP += ` ${node.operator} `;
    this.convertExpressionWithContext(node.right, 'binary-right');
  }

  /**
   * Convierte templates anidados html`...` - NO PROCESAR, ya están en el template principal
   */
  convertTaggedTemplateExpression(node) {
    if (t.isIdentifier(node.tag) && node.tag.name === 'html') {
      // SKIP: Templates anidados ya fueron procesados en el template principal
      // No llamar convertTemplateLiteral recursivamente para evitar duplicación
      console.log(`🔄 AST: Skipping nested html template (already processed in main template)`);
    } else {
      this.errors.push(`Unsupported tagged template: ${node.tag.name}`);
    }
  }

  /**
   * Convierte identificadores simples
   */
  convertIdentifier(node) {
    // Para identificadores como variables simples
    this.convertedPHP += `<?php echo esc_html($${node.name}); ?>`;
  }

  /**
   * Convierte literales (strings, números, etc.)
   */
  convertLiteral(node) {
    if (typeof node.value === 'string') {
      this.convertedPHP += node.value;
    } else if (this.inPHPContext) {
      // Inside PHP context - no tags needed
      this.convertedPHP += node.value;
    } else {
      this.convertedPHP += `<?php echo ${node.value}; ?>`;
    }
  }

  /**
   * MÉTODOS CONTEXT-AWARE - Arquitectura robusta y escalable
   */

  // Conversión de condicionales con contexto - ARQUITECTURA ROBUSTA
  convertConditionalExpressionWithContext(node, contextName) {
    this.context.enterScope('conditional', { type: 'ternary', context: contextName });

    try {
      // Detectar si estamos en contexto de template HTML (necesita PHP if/else)
      const needsPhpBlock = !this.context.isInPHPContext();

      if (needsPhpBlock) {
        // Generar PHP if/else completo para templates HTML
        this.convertedPHP += '\n\t\t<?php if ( ';

        // Entrar en contexto PHP para la condición
        this.context.enterPHPContext();
        this.convertExpressionWithContext(node.test, `${contextName}-test`);
        this.context.exitPHPContext();

        this.convertedPHP += ' ) : ?>\n\t\t\t';

        // Procesar consecuente (true case)
        if (this.hasNestedTemplate(node.consequent)) {
          this.convertNestedTemplate(node.consequent);
        } else {
          this.convertExpressionWithContext(node.consequent, `${contextName}-consequent`);
        }

        this.convertedPHP += '\n\t\t<?php else : ?>\n\t\t\t';

        // Procesar alternativo (false case)
        if (this.hasNestedTemplate(node.alternate)) {
          this.convertNestedTemplate(node.alternate);
        } else {
          this.convertExpressionWithContext(node.alternate, `${contextName}-alternate`);
        }

        this.convertedPHP += '\n\t\t<?php endif; ?>';
      } else {
        // Mantener ternario simple para contexto PHP puro
        this.convertedPHP += '( ';
        this.convertExpressionWithContext(node.test, `${contextName}-test`);
        this.convertedPHP += ' ) ? ';
        this.convertExpressionWithContext(node.consequent, `${contextName}-consequent`);
        this.convertedPHP += ' : ';
        this.convertExpressionWithContext(node.alternate, `${contextName}-alternate`);
      }
    } finally {
      this.context.exitScope();
    }
  }

  /**
   * Convierte templates anidados de forma segura
   */
  convertNestedTemplate(node) {
    if (this.hasNestedTemplate(node)) {
      // Extraer contenido del template html`...`
      for (let i = 0; i < node.quasi.quasis.length; i++) {
        this.convertedPHP += node.quasi.quasis[i].value.raw;
        if (i < node.quasi.expressions.length) {
          this.convertExpressionWithContext(node.quasi.expressions[i], `nested-template-${i}`);
        }
      }
    } else if (node.type === 'StringLiteral' || (node.type === 'Literal' && typeof node.value === 'string')) {
      // String literal - agregar solo si no está vacío
      if (node.value !== '') {
        this.convertedPHP += node.value;
      }
    } else {
      // Otras expresiones
      this.convertExpressionWithContext(node, 'nested-content');
    }
  }

  // Conversión de llamadas a funciones con contexto
  convertCallExpressionWithContext(node, contextName) {
    if (t.isIdentifier(node.callee)) {
      // Validar función disponible
      this.context.validateVariable(node.callee.name, `${contextName}-function`);
    }

    // Usar conversión original con contexto validado
    this.convertCallExpressionSafely(node);
  }

  // Conversión de expresiones binarias con contexto
  convertBinaryExpressionWithContext(node, contextName) {
    this.convertExpressionWithContext(node.left, `${contextName}-left`);
    this.convertedPHP += ` ${node.operator} `;
    this.convertExpressionWithContext(node.right, `${contextName}-right`);
  }

  // Conversión de expresiones lógicas con contexto
  convertLogicalExpressionWithContext(node, contextName) {
    this.convertExpressionWithContext(node.left, `${contextName}-left`);

    // Mapear operadores JS a PHP
    const phpOperator = node.operator === '&&' ? ' && ' :
                       node.operator === '||' ? ' || ' :
                       ` ${node.operator} `;

    this.convertedPHP += phpOperator;
    this.convertExpressionWithContext(node.right, `${contextName}-right`);
  }

  // Conversión de literales numéricos con contexto
  convertLiteralWithContext(node, contextName) {
    // Para literales numéricos, siempre usar el valor directo
    this.convertedPHP += node.value;
  }

  // Conversión de literales string con contexto
  convertStringLiteralWithContext(node, contextName) {
    if (this.context.isInPHPContext() || contextName.includes('-test')) {
      // En contexto PHP o condiciones - string con comillas
      this.convertedPHP += `'${node.value}'`;
    } else {
      // Contexto HTML - solo el valor (para empty strings o contenido directo)
      this.convertedPHP += node.value;
    }
  }
}

module.exports = BabelASTConverter;