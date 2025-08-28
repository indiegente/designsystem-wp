/**
 * Casos Edge que pueden romper la generación automática de stories
 * Estos son ejemplos de patrones problemáticos que debemos contemplar
 */

// CASO 1: Properties sin type definido
export class ComponentWithoutTypes extends LitElement {
  static properties = {
    title: {},  // ❌ Sin type
    count: { attribute: 'count' },  // ❌ Sin type
    data: { reflect: true }  // ❌ Sin type
  };
}

// CASO 2: Properties con types no estándar
export class ComponentWithCustomTypes extends LitElement {
  static properties = {
    customType: { type: CustomClass },  // ❌ Type personalizado
    eventHandler: { type: Function },   // ❌ Function type
    complexObject: { type: WeakMap },   // ❌ Type complejo
    dateValue: { type: Date }           // ❌ Date type
  };
}

// CASO 3: Properties con configuraciones complejas
export class ComponentWithComplexProperties extends LitElement {
  static properties = {
    title: { 
      type: String,
      attribute: 'my-title',
      reflect: true,
      converter: {
        fromAttribute: (value) => value.toUpperCase(),
        toAttribute: (value) => value.toLowerCase()
      },
      hasChanged: (newVal, oldVal) => newVal !== oldVal,
      noAccessor: false
    },
    items: {
      type: Array,
      state: true,  // ❌ Internal state, no debería ser en stories
      hasChanged: (newVal, oldVal) => JSON.stringify(newVal) !== JSON.stringify(oldVal)
    }
  };
}

// CASO 4: Properties con valores por defecto en constructor
export class ComponentWithConstructorDefaults extends LitElement {
  static properties = {
    title: { type: String },
    items: { type: Array }
  };

  constructor() {
    super();
    // ❌ Valores por defecto aquí, no en properties
    this.title = 'Default Title';
    this.items = [{ id: 1, name: 'Item 1' }];
    this.privateProperty = 'not exposed';
  }
}

// CASO 5: Sin static properties en absoluto
export class ComponentWithoutProperties extends LitElement {
  // ❌ No tiene static properties
  render() {
    return html`<div>Static content</div>`;
  }
}

// CASO 6: Properties definidas dinámicamente
export class ComponentWithDynamicProperties extends LitElement {
  static get properties() {  // ❌ Getter en lugar de static properties
    return {
      title: { type: String },
      dynamicProp: { type: String }
    };
  }
}

// CASO 7: Mixin patterns
const WithCustomMixin = (BaseClass) => class extends BaseClass {
  static properties = {
    ...super.properties,
    mixinProp: { type: String }
  };
};

export class ComponentWithMixin extends WithCustomMixin(LitElement) {
  static properties = {
    ...super.properties,  // ❌ Herencia compleja
    ownProp: { type: String }
  };
}

// CASO 8: Properties con nombres problemáticos  
export class ComponentWithProblematicNames extends LitElement {
  static properties = {
    'data-attribute': { type: String },  // ❌ Nombre con guiones
    className: { type: String },         // ❌ Palabra reservada
    constructor: { type: String },       // ❌ Palabra reservada JS
    prototype: { type: String },         // ❌ Palabra reservada JS
    __private: { type: String },         // ❌ Nombre privado
    '123number': { type: String }        // ❌ Empieza con número
  };
}

// CASO 9: Properties con types de terceros
export class ComponentWithThirdPartyTypes extends LitElement {
  static properties = {
    moment: { type: moment },           // ❌ Moment.js
    lodash: { type: _ },                // ❌ Lodash
    rxjs: { type: Observable },         // ❌ RxJS
    custom: { type: SomeThirdPartyClass } // ❌ Librería externa
  };
}

// CASO 10: Component sin export correcto
class ComponentWithoutExport extends LitElement {  // ❌ Sin export
  static properties = {
    title: { type: String }
  };
}

// CASO 11: Multiple exports en un archivo
export class FirstComponent extends LitElement {
  static properties = { title: { type: String } };
}

export class SecondComponent extends LitElement {  // ❌ Segundo export
  static properties = { subtitle: { type: String } };
}

// CASO 12: Properties con validación compleja
export class ComponentWithValidation extends LitElement {
  static properties = {
    email: {
      type: String,
      hasChanged: (newVal, oldVal) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(newVal) && newVal !== oldVal;
      }
    },
    age: {
      type: Number,
      hasChanged: (newVal, oldVal) => {
        return newVal >= 0 && newVal <= 120 && newVal !== oldVal;
      }
    }
  };
}

// CASO 13: Properties con converters personalizados
export class ComponentWithConverters extends LitElement {
  static properties = {
    jsonData: {
      type: Object,
      converter: {
        fromAttribute: (value) => {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        },
        toAttribute: (value) => JSON.stringify(value)
      }
    },
    csvList: {
      type: Array,
      converter: {
        fromAttribute: (value) => value ? value.split(',') : [],
        toAttribute: (value) => Array.isArray(value) ? value.join(',') : ''
      }
    }
  };
}

// CASO 14: Component con syntax errors
export class ComponentWithSyntaxError extends LitElement {
  static properties = {
    title: { type: String },
    // missing comma
    subtitle { type: String }  // ❌ Syntax error
  };
}

// CASO 15: Properties con comentarios inline complejos
export class ComponentWithComments extends LitElement {
  static properties = {
    title: { type: String }, // Simple title
    /* Complex comment
       spanning multiple lines
       with special characters: {}[]() */
    subtitle: { type: String }, // Another comment
    // TODO: Add validation
    data: { type: Array } /* inline comment */
  };
}