/**
 * 🎯 Default Value Parser - Sistema robusto y escalable
 *
 * Centraliza la lógica de parsing de valores por defecto para:
 * - PHP function parameters
 * - JavaScript/Gutenberg blocks
 * - ACF field defaults
 * - Validation
 */

class DefaultValueParser {
    /**
     * Convierte valor por defecto a PHP válido
     * @param {*} value - Valor por defecto desde metadata
     * @param {string} type - Tipo del parámetro (string, array, boolean, etc.)
     * @param {string} context - Contexto de uso (function_param, acf_default, etc.)
     * @returns {string} - Código PHP válido
     */
    static toPHP(value, type, context = 'function_param') {
        // Null safety
        if (value === null || value === undefined) {
            return this.getDefaultForType(type, 'php');
        }

        switch (type) {
            case 'array':
                return this.parseArrayToPHP(value, context);

            case 'object':
                return this.parseObjectToPHP(value, context);

            case 'boolean':
                return this.parseBooleanToPHP(value);

            case 'number':
                return this.parseNumberToPHP(value);

            case 'string':
                return this.parseStringToPHP(value, context);

            default:
                console.warn(`⚠️ Unknown type '${type}' for value '${value}', treating as string`);
                return this.parseStringToPHP(value, context);
        }
    }

    /**
     * Convierte valor por defecto a JavaScript válido
     * @param {*} value - Valor por defecto desde metadata
     * @param {string} type - Tipo del parámetro
     * @param {string} context - Contexto (gutenberg, acf_js, etc.)
     * @returns {*} - Valor JavaScript nativo
     */
    static toJS(value, type, context = 'gutenberg') {
        if (value === null || value === undefined) {
            return this.getDefaultForType(type, 'js');
        }

        switch (type) {
            case 'array':
                return this.parseArrayToJS(value);

            case 'object':
                return this.parseObjectToJS(value);

            case 'boolean':
                return this.parseBooleanToJS(value);

            case 'number':
                return this.parseNumberToJS(value);

            case 'string':
                return this.parseStringToJS(value);

            default:
                console.warn(`⚠️ Unknown type '${type}' for value '${value}', treating as string`);
                return this.parseStringToJS(value);
        }
    }

    /**
     * Valida que el valor sea compatible con el tipo
     * @param {*} value - Valor a validar
     * @param {string} type - Tipo esperado
     * @returns {boolean} - Si es válido
     */
    static validate(value, type) {
        if (value === null || value === undefined) {
            return true; // null values are always valid (will use type defaults)
        }

        switch (type) {
            case 'array':
                return Array.isArray(value) ||
                       value === '[]' ||
                       value === 'array()' ||
                       (typeof value === 'string' && value.startsWith('[') && value.endsWith(']'));

            case 'object':
                return typeof value === 'object' ||
                       value === '{}' ||
                       value === 'array()' ||
                       (typeof value === 'string' && value.startsWith('{') && value.endsWith('}'));

            case 'boolean':
                return typeof value === 'boolean' ||
                       value === 'true' ||
                       value === 'false';

            case 'number':
                return typeof value === 'number' ||
                       !isNaN(Number(value));

            case 'string':
                return true; // strings can be anything

            default:
                return true; // unknown types are treated as valid
        }
    }

    // ========================================
    // ARRAY PARSING
    // ========================================

    static parseArrayToPHP(value, context) {
        // Native JavaScript array
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return 'array()';
            }
            const phpItems = value.map(item => this.valueToPhpLiteral(item));
            return `array(${phpItems.join(', ')})`;
        }

        // String representations
        if (typeof value === 'string') {
            if (value === '[]' || value === 'array()' || value.trim() === '') {
                return 'array()';
            }

            // Try to parse JSON array
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return this.parseArrayToPHP(parsed, context);
                }
            } catch (e) {
                // Not valid JSON, treat as empty array
            }
        }

        // Fallback
        return 'array()';
    }

    static parseArrayToJS(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === 'string') {
            if (value === '[]' || value === 'array()' || value.trim() === '') {
                return [];
            }

            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                // Not valid JSON
            }
        }

        return [];
    }

    // ========================================
    // OBJECT PARSING
    // ========================================

    static parseObjectToPHP(value, context) {
        if (typeof value === 'object' && value !== null) {
            if (Object.keys(value).length === 0) {
                return 'array()';
            }
            const phpPairs = Object.entries(value).map(([k, v]) =>
                `'${k}' => ${this.valueToPhpLiteral(v)}`
            );
            return `array(${phpPairs.join(', ')})`;
        }

        if (typeof value === 'string') {
            if (value === '{}' || value === 'array()' || value.trim() === '') {
                return 'array()';
            }

            try {
                const parsed = JSON.parse(value);
                if (typeof parsed === 'object') {
                    return this.parseObjectToPHP(parsed, context);
                }
            } catch (e) {
                // Not valid JSON
            }
        }

        return 'array()';
    }

    static parseObjectToJS(value) {
        if (typeof value === 'object' && value !== null) {
            return value;
        }

        if (typeof value === 'string') {
            if (value === '{}' || value === 'array()' || value.trim() === '') {
                return {};
            }

            try {
                const parsed = JSON.parse(value);
                if (typeof parsed === 'object') {
                    return parsed;
                }
            } catch (e) {
                // Not valid JSON
            }
        }

        return {};
    }

    // ========================================
    // PRIMITIVE PARSING
    // ========================================

    static parseBooleanToPHP(value) {
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (lower === 'true' || lower === '1') return 'true';
            if (lower === 'false' || lower === '0') return 'false';
        }

        return 'false';
    }

    static parseBooleanToJS(value) {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === '1';
        }

        return false;
    }

    static parseNumberToPHP(value) {
        const num = Number(value);
        return isNaN(num) ? '0' : String(num);
    }

    static parseNumberToJS(value) {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    static parseStringToPHP(value, context) {
        if (typeof value !== 'string') {
            value = String(value);
        }

        // Escape single quotes for PHP
        const escaped = value.replace(/'/g, "\\'");

        if (context === 'function_param') {
            return `'${escaped}'`;
        }

        return `'${escaped}'`;
    }

    static parseStringToJS(value) {
        return String(value);
    }

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Convierte valor JavaScript a literal PHP
     */
    static valueToPhpLiteral(value) {
        if (value === null || value === undefined) {
            return 'null';
        }

        if (typeof value === 'string') {
            return `'${value.replace(/'/g, "\\'")}'`;
        }

        if (typeof value === 'number') {
            return String(value);
        }

        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (Array.isArray(value)) {
            const items = value.map(item => this.valueToPhpLiteral(item));
            return `array(${items.join(', ')})`;
        }

        if (typeof value === 'object') {
            const pairs = Object.entries(value).map(([k, v]) =>
                `'${k}' => ${this.valueToPhpLiteral(v)}`
            );
            return `array(${pairs.join(', ')})`;
        }

        return `'${String(value)}'`;
    }

    /**
     * Obtiene valor por defecto para un tipo
     */
    static getDefaultForType(type, target = 'php') {
        const defaults = {
            php: {
                'string': "''",
                'number': '0',
                'boolean': 'false',
                'array': 'array()',
                'object': 'array()'
            },
            js: {
                'string': '',
                'number': 0,
                'boolean': false,
                'array': [],
                'object': {}
            }
        };

        return defaults[target][type] || (target === 'php' ? "''" : '');
    }

    /**
     * Genera reporte de parsing para debugging
     */
    static generateParsingReport(metadata) {
        const report = {
            components: 0,
            parameters: 0,
            validDefaults: 0,
            invalidDefaults: 0,
            typeBreakdown: {},
            issues: []
        };

        Object.entries(metadata).forEach(([componentName, componentData]) => {
            if (componentName === 'wordpress_plugins') return;

            report.components++;

            if (componentData.parameters) {
                componentData.parameters.forEach(param => {
                    report.parameters++;

                    const isValid = this.validate(param.default, param.type);
                    if (isValid) {
                        report.validDefaults++;
                    } else {
                        report.invalidDefaults++;
                        report.issues.push({
                            component: componentName,
                            parameter: param.name,
                            type: param.type,
                            value: param.default,
                            issue: 'Invalid default value for type'
                        });
                    }

                    report.typeBreakdown[param.type] = (report.typeBreakdown[param.type] || 0) + 1;
                });
            }
        });

        return report;
    }
}

module.exports = DefaultValueParser;