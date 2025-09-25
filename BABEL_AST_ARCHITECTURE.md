# 🧠 Babel AST: Arquitectura de Conversión Lit → PHP

**Sistema inteligente de conversión automática con metadata-driven escape security**

## 🎯 Visión General

El sistema Babel AST es el núcleo que convierte componentes Lit Element a PHP WordPress siguiendo las reglas de `.rules`:

- ✅ **Metadata obligatoria**: Sin fallbacks silenciosos
- ✅ **Context tracking**: Variables de scope rastreadas
- ✅ **Fail-fast**: Errores claros si falta metadata
- ✅ **WordPress standards**: Escape automático aplicado

## 🏗️ Arquitectura del Sistema

### Ubicación Principal
```
scripts/wp-generator/templates/babel-ast-converter.js
```

### Clases y Responsabilidades

#### 1. **BabelASTConverter** - Clase Principal
```javascript
class BabelASTConverter {
  constructor(metadata) {
    this.metadata = metadata;           // Escape metadata cargada
    this.context = new ContextTracker(); // Rastreo de variables
    this.convertedPHP = '';            // PHP output acumulado
    this.errors = [];                  // Error collection
  }
}
```

#### 2. **ContextTracker** - Rastreo de Variables
```javascript
class ContextTracker {
  constructor() {
    this.stack = [];      // Stack de contextos anidados
    this.variables = {};  // Variables disponibles en scope
    this.loops = {};      // Variables de foreach/map loops
  }
}
```

## 🔍 Proceso de Conversión

### Fase 1: Parse y Configuración
```javascript
// 1. Cargar metadata escape
this.metadata = JSON.parse(fs.readFileSync('src/metadata.json'));
console.log('📋 Metadata de escape cargada exitosamente');

// 2. Wrap template para parsing válido
const wrappedCode = `function render() { return html\`${litTemplate}\`; }`;

// 3. Parse con Babel
const ast = babel.parse(wrappedCode, {
  sourceType: 'module',
  plugins: ['typescript']
});
```

### Fase 2: Traversal con Context Tracking
```javascript
traverseAndConvertWithContext(ast) {
  // Visitor pattern para cada tipo de nodo AST
  const visitor = {
    MemberExpression: this.convertMemberExpression.bind(this),
    ConditionalExpression: this.convertConditionalExpression.bind(this),
    CallExpression: this.convertCallExpression.bind(this),
    // ... más visitors
  };

  babel.traverse(ast, visitor);
}
```

### Fase 3: Escape Metadata Lookup
```javascript
getEscapeInfo(propertyName, componentName, isInAttribute = false, attributeName = '') {
  // 1. Contexto semántico (prioridad más alta)
  if (isInAttribute) {
    if (attributeName === 'href' || attributeName === 'src') {
      return { function: 'esc_url', reason: `contextual:attribute[${attributeName}]` };
    }
    return { function: 'esc_attr', reason: `contextual:attribute[${attributeName}]` };
  }

  // 2. Metadata declarativa
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

  // 3. FAIL FAST: Sin fallbacks según .rules
  throw new Error(`❌ ESCAPE METADATA FALTANTE: Campo '${propertyName}' en componente '${componentName}' no tiene escape metadata declarativo. Actualizar src/metadata.json`);
}
```

## 📊 Tipos de Nodos AST Soportados

### 1. **MemberExpression** - `this.variable`
```javascript
convertMemberExpression(path) {
  if (t.isThisExpression(path.node.object)) {
    const propertyName = path.node.property.name;
    const escapeInfo = this.getEscapeInfo(propertyName, this.componentName);

    console.log(`🔒 Escape aplicado: ${propertyName} -> ${escapeInfo.function} (${escapeInfo.reason})`);

    this.convertedPHP += `<?php echo ${escapeInfo.function}($${propertyName}); ?>`;
  }
}
```

### 2. **ConditionalExpression** - `condition ? true : false`
```javascript
convertConditionalExpression(node) {
  this.convertedPHP += `<?php if (`;
  this.convertCondition(node.test);
  this.convertedPHP += `): ?>`;

  this.convertExpressionWithContext(node.consequent, 'conditional-consequent');

  this.convertedPHP += `<?php else: ?>`;
  this.convertExpressionWithContext(node.alternate, 'conditional-alternate');
  this.convertedPHP += `<?php endif; ?>`;
}
```

### 3. **CallExpression** - `array.map(callback)`
```javascript
convertCallExpression(path) {
  const { object, property } = path.node.callee;

  if (property && property.name === 'map') {
    const arrayName = object.property.name;
    const callbackParam = path.node.arguments[0].params[0].name;

    // Entrar en contexto de loop
    this.context.enterLoop(arrayName, callbackParam);

    this.convertedPHP += `<?php foreach ($${arrayName} as $${callbackParam}): ?>`;

    // Procesar callback body
    this.convertCallbackBody(path.node.arguments[0].body);

    this.convertedPHP += `<?php endforeach; ?>`;

    // Salir de contexto de loop
    this.context.exitLoop();
  }
}
```

## 🔒 Sistema de Escape Metadata-Driven

### Estructura de Metadata
```json
{
  "hero-section": {
    "parameters": [
      { "name": "title", "type": "string", "escape": "html" },
      { "name": "link", "type": "string", "escape": "url" },
      { "name": "featured", "type": "boolean", "escape": "attr" }
    ],
    "arrayFields": {
      "features": [
        { "name": "icon", "type": "string", "fieldType": "text", "escape": "html" },
        { "name": "url", "type": "string", "fieldType": "url", "escape": "url" }
      ]
    }
  }
}
```

### Mapping de Escape Functions
```javascript
const escapeMap = {
  'html': 'esc_html',    // Para texto normal
  'url': 'esc_url',      // Para URLs y links
  'attr': 'esc_attr',    // Para atributos HTML
  'js': 'esc_js',        // Para JavaScript inline
  'none': 'none'         // Sin escape (casos especiales)
};
```

### Logging Detallado
```bash
🔍 AST: Converting hero-section with comprehensive context tracking
🎯 AST: Processing MAIN template for hero-section with context validation
🔄 Context: Processing MemberExpression in context 'expression_0'
🔒 Escape aplicado: title -> esc_html (metadata:html)
🔄 Context: Processing ConditionalExpression in context 'expression_1'
🔒 Escape aplicado: featured -> esc_attr (metadata:attr)
✅ AST: Successfully converted hero-section with context validation
```

## 🚨 Fail-Fast Error Handling

### Tipos de Errores
```javascript
// 1. Metadata faltante para parameter
throw new Error(`❌ ESCAPE METADATA FALTANTE: Campo '${propertyName}' en componente '${componentName}' no tiene escape metadata declarativo. Actualizar src/metadata.json`);

// 2. Metadata faltante para array field
throw new Error(`❌ ARRAY FIELD ESCAPE METADATA FALTANTE: Campo '${fieldName}' en arrays de componente '${componentName}' no tiene escape metadata declarativo. Actualizar arrayFields en src/metadata.json`);

// 3. Context de loop inválido
throw new Error(`❌ LOOP CONTEXT ERROR: Variable '${variableName}' no encontrada en contexto de loop`);
```

### Rollback Automático
```javascript
async convertComponent(componentName, litTemplate) {
  try {
    return this.convertLitTemplateToPhp(litTemplate, componentName);
  } catch (error) {
    // Rollback automático
    this.cleanup();
    this.errors.push({
      component: componentName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error; // Re-throw para fail-fast
  }
}
```

## 🧩 Context Tracking System

### Stack de Contextos
```javascript
class ContextTracker {
  enterContext(contextName, variables = {}) {
    this.stack.push({
      name: contextName,
      variables: { ...this.variables, ...variables },
      timestamp: Date.now()
    });
    this.variables = { ...this.variables, ...variables };
  }

  exitContext() {
    if (this.stack.length > 0) {
      const context = this.stack.pop();
      this.variables = this.stack.length > 0
        ? this.stack[this.stack.length - 1].variables
        : {};
    }
  }
}
```

### Loop Variable Tracking
```javascript
enterLoop(arrayName, itemVariable) {
  this.enterContext(`loop-${arrayName}`, {
    [itemVariable]: `item from ${arrayName}`,
    [`${arrayName}_index`]: 'loop index'
  });

  console.log(`🔄 Context: Entering map-to-foreach loop - ${arrayName} as ${itemVariable}`);
}

getLoopVariable(objectName) {
  for (let i = this.stack.length - 1; i >= 0; i--) {
    const context = this.stack[i];
    if (context.name.startsWith('loop-') && context.name.includes(objectName)) {
      // Extraer variable del contexto
      const contextMatch = context.name.match(/loop-(.+)/);
      if (contextMatch) {
        return this.getContextualLoopVariable(contextMatch[1]);
      }
    }
  }

  throw new Error(`❌ LOOP CONTEXT ERROR: No se encontró contexto de loop para '${objectName}'`);
}
```

## 📈 Métricas y Validación

### Estadísticas de Conversión
```javascript
generateConversionStats() {
  return {
    componentsProcessed: this.processedComponents.length,
    expressionsConverted: this.expressionCount,
    escapeApplications: this.escapeCount,
    errorsFound: this.errors.length,
    conversionTime: this.endTime - this.startTime
  };
}
```

### Validación Post-Conversión
```javascript
validateConversion(phpOutput) {
  const validations = [
    this.validatePHPSyntax(phpOutput),
    this.validateEscapeFunctions(phpOutput),
    this.validateWordPressStandards(phpOutput)
  ];

  return validations.every(validation => validation.passed);
}
```

## 🔧 Configuración y Extensibilidad

### Configuración del Converter
```javascript
const converterConfig = {
  strict: true,              // Fail-fast mode
  validateMetadata: true,    // Pre-validate metadata
  logLevel: 'verbose',       // Logging level
  enableContextTracking: true, // Context tracking
  wordpressVersion: '6.0'    // Target WordPress version
};
```

### Plugins y Extensiones
```javascript
// Plugin interface for extending conversion
class ConversionPlugin {
  name = 'custom-plugin';

  beforeConversion(ast, metadata) {
    // Pre-processing hook
  }

  afterConversion(phpOutput, stats) {
    // Post-processing hook
  }

  handleCustomNode(path, converter) {
    // Custom AST node handling
  }
}
```

## 📚 Casos de Uso Avanzados

### 1. Nested Templates
```javascript
// Lit template con templates anidados
html`
  <div class="container">
    ${this.showHeader ? html`
      <header>
        <h1>${this.title}</h1>
      </header>
    ` : ''}
  </div>
`;
```

### 2. Complex Loops
```javascript
// Arrays anidados y map complejos
html`
  ${this.categories.map(category => html`
    <div class="category">
      <h2>${category.name}</h2>
      ${category.items.map(item => html`
        <span>${item.title}</span>
      `)}
    </div>
  `)}
`;
```

### 3. Dynamic Classes
```javascript
// Clases dinámicas con condicionales
html`
  <article class="post ${this.featured ? 'featured' : ''} ${this.category}">
    <h2>${this.title}</h2>
  </article>
`;
```

## 🎯 Best Practices

### 1. Metadata Completa
```json
// ✅ CORRECTO: Metadata completa
{
  "name": "title",
  "type": "string",
  "default": "",
  "escape": "html",
  "fieldType": "text"
}

// ❌ INCORRECTO: Metadata incompleta
{
  "name": "title",
  "type": "string"
  // Falta escape - causará error
}
```

### 2. Context Awareness
```javascript
// ✅ CORRECTO: Usar context tracking
this.context.enterContext('conditional-branch');
this.convertExpressionWithContext(node.consequent, 'conditional-consequent');
this.context.exitContext();

// ❌ INCORRECTO: Conversión sin contexto
this.convertExpression(node.consequent); // Puede perder variables de scope
```

### 3. Error Handling
```javascript
// ✅ CORRECTO: Fail-fast con mensaje claro
if (!escapeInfo) {
  throw new Error(`❌ ESCAPE METADATA FALTANTE: Campo '${propertyName}' en componente '${componentName}' no tiene escape metadata declarativo. Actualizar src/metadata.json`);
}

// ❌ INCORRECTO: Fallback silencioso
const escapeFunction = escapeInfo || 'esc_html'; // Viola .rules
```

## 🚀 Estado del Sistema

**✅ PRODUCCIÓN-READY**
- Conversión completa Lit → PHP
- Metadata-driven escape security
- Context tracking robusto
- Fail-fast error handling
- WordPress standards compliance
- Rollback automático en errores

---

**🎯 El sistema Babel AST garantiza conversión segura y estándar de componentes Lit a PHP WordPress sin comprometer seguridad ni calidad.**