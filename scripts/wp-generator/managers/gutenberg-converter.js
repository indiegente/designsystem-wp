const fs = require('fs');
const path = require('path');
const DefaultValueParser = require('../utils/default-value-parser');

/**
 * 🧩 Gutenberg Blocks Converter - Convierte Lit Components a Gutenberg Blocks
 *
 * Genera automáticamente bloques de Gutenberg desde componentes Lit existentes,
 * permitiendo usar los componentes del design system en el editor de WordPress
 */
class GutenbergConverter {
    constructor(config) {
        this.config = config;
        this.outputDir = config.outputDir;
        this.themeName = config.themeName;

        // Cargar metadata de componentes
        const ConfigSingleton = require('../core/config-singleton');
        const configSingleton = ConfigSingleton.getInstance();
        this.metadata = configSingleton.getMetadata();

        // Directorio de bloques
        this.blocksDir = path.join(this.outputDir, this.themeName, 'blocks');
    }

    /**
     * Genera todos los bloques de Gutenberg desde componentes Lit
     */
    generateAllBlocks() {
        console.log('🧩 Generando bloques de Gutenberg desde componentes Lit...');

        // Crear directorio de bloques si no existe
        if (!fs.existsSync(this.blocksDir)) {
            fs.mkdirSync(this.blocksDir, { recursive: true });
        }

        let generatedBlocks = 0;

        // Iterar sobre todos los componentes en metadata
        Object.entries(this.metadata).forEach(([componentName, componentConfig]) => {
            // Solo generar bloques para componentes válidos (no wordpress_plugins)
            if (componentName === 'wordpress_plugins') return;

            this.generateGutenbergBlock(componentName, componentConfig);
            generatedBlocks++;
        });

        // Generar index.php para registrar todos los bloques
        this.generateBlocksIndex();

        // Generar CSS para editor de Gutenberg
        this.generateBlocksEditorCSS();

        console.log(`✅ Gutenberg: ${generatedBlocks} bloques generados desde componentes Lit`);
        return { blocksGenerated: generatedBlocks };
    }

    /**
     * Genera un bloque de Gutenberg individual
     */
    generateGutenbergBlock(componentName, componentConfig) {
        const blockDir = path.join(this.blocksDir, componentName);

        // Crear directorio del bloque
        if (!fs.existsSync(blockDir)) {
            fs.mkdirSync(blockDir, { recursive: true });
        }

        // Generar block.json
        this.generateBlockJson(blockDir, componentName, componentConfig);

        // Generar index.php (registration)
        this.generateBlockIndex(blockDir, componentName, componentConfig);


        // Generar edit.js (editor component)
        this.generateBlockEdit(blockDir, componentName, componentConfig);

        // Generar style.scss (frontend styles)
        this.generateBlockStyle(blockDir, componentName);

        // Generar editor.css (editor-specific styles)
        this.generateBlockEditorStyle(blockDir, componentName);
    }

    /**
     * Genera block.json para el bloque
     */
    generateBlockJson(blockDir, componentName, componentConfig) {
        const themePrefix = this.config.themePrefix || 'ds';
        const themeName = this.config.themeName || 'design-system';
        const themeDisplayName = this.config.themeDisplayName || 'Design System';
        const functionPrefix = this.config.phpFunctionPrefix || 'toulouse';
        const blockName = componentName.replace(/-/g, '_');

        const blockJson = {
            "$schema": "https://schemas.wp.org/trunk/block.json",
            "apiVersion": 3,
            "name": `${themePrefix}/${componentName}`,
            "version": "1.0.0",
            "title": this.generateBlockTitle(componentName),
            "category": `${themePrefix}-blocks`,
            "icon": this.getBlockIcon(componentConfig.type),
            "description": `${this.generateBlockTitle(componentName)} component from the ${themeDisplayName}. Generated from Lit component.`,
            "keywords": [
                themePrefix,
                "design-system",
                componentName,
                componentConfig.type || "component"
            ],
            "supports": {
                "html": false,
                "anchor": true,
                "customClassName": true,
                "className": true,
                "reusable": true,
                "inserter": true,
                "multiple": componentConfig.type !== 'static',
                "lock": false,
                "spacing": {
                    "margin": true,
                    "padding": true
                },
                "typography": {
                    "fontSize": true,
                    "lineHeight": true
                }
            },
            "attributes": this.convertParametersToAttributes(componentConfig.parameters || []),
            "providesContext": {},
            "usesContext": [],
            "textdomain": themeName,
            "editorScript": "file:./edit.js",
            "editorStyle": "file:./editor.css",
            "style": "file:./style.css"
        };

        // Agregar arrayFields como attributes complejos
        if (componentConfig.arrayFields) {
            Object.entries(componentConfig.arrayFields).forEach(([fieldName, fieldConfig]) => {
                blockJson.attributes[fieldName] = {
                    type: "array",
                    default: [],
                    items: {
                        type: "object",
                        properties: this.convertArrayFieldsToProperties(fieldConfig)
                    }
                };
            });
        }

        const blockJsonPath = path.join(blockDir, 'block.json');
        fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, 2));
    }

    /**
     * Genera index.php para registro del bloque (WordPress Standard)
     */
    generateBlockIndex(blockDir, componentName, componentConfig) {
        const functionPrefix = this.config.phpFunctionPrefix || 'toulouse';
        const blockName = componentName.replace(/-/g, '_');
        const themePrefix = this.config.themePrefix || 'tl';
        const renderFunctionName = `render_${blockName}`;
        const componentPhpPath = `/components/${componentName}/${componentName}.php`;

        const attributeExtractions = this.generateAttributeExtractions(componentConfig.parameters || []);
        const functionCallParams = this.generateFunctionCallParams(componentConfig.parameters || []);

        const indexPhp = `<?php
/**
 * Block Registration: ${componentName}
 * WordPress Standards Compliant
 * Auto-discovered via block.json
 *
 * @package ${this.config.themeName || 'toulouse-lautrec'}
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Render callback for ${componentName} block
 * Calls existing component render function
 */
function ${functionPrefix}_render_${blockName}_block( $attributes, $content, $block ) {
    // Load component render function if not already loaded
    if ( ! function_exists( '${renderFunctionName}' ) ) {
        require_once get_template_directory() . '${componentPhpPath}';
    }

    // Extract attributes with defaults
    ${attributeExtractions}

    // Capture output from component render function
    ob_start();
    ${renderFunctionName}(${functionCallParams});
    return ob_get_clean();
}

/**
 * Register ${componentName} block
 * ✅ WORDPRESS BEST PRACTICE: Register with explicit render callback
 */
if ( function_exists( 'register_block_type' ) ) {
    register_block_type( __DIR__, array(
        'render_callback' => '${functionPrefix}_render_${blockName}_block'
    ) );
}
?>`;

        const indexPhpPath = path.join(blockDir, 'index.php');
        fs.writeFileSync(indexPhpPath, indexPhp);
    }

    /**
     * Genera edit.js para el editor de Gutenberg
     */
    generateBlockEdit(blockDir, componentName, componentConfig) {
        const themePrefix = this.config.themePrefix || 'ds';
        const themeName = this.config.themeName || 'design-system';

        const editJs = `/**
 * Block Editor Script: ${componentName}
 * Generated automatically from Lit Component
 * WordPress Standards Compliant - Vanilla JavaScript
 *
 * @package ${themeName}
 * @since 1.0.0
 */

(function() {
    'use strict';

    // WordPress dependencies
    const { __ } = wp.i18n;
    const { useBlockProps, InspectorControls } = wp.blockEditor;
    const { PanelBody, TextControl, ToggleControl, RangeControl, Notice } = wp.components;
    const { createElement: el, Fragment } = wp.element;

    /**
     * Edit component for ${componentName} block
     * ✅ WORDPRESS STANDARD: Simple React component
     */
    function Edit(props) {
        const { attributes, setAttributes } = props;

        // Extract attributes with defaults
        const {${this.generateAttributeDestructuring(componentConfig.parameters || [])}
        } = attributes;

        // ✅ WORDPRESS STANDARD: Safe block props
        const blockProps = useBlockProps ? useBlockProps({
            className: '${themePrefix}-${componentName}-block'
        }) : {
            className: '${themePrefix}-${componentName}-block'
        };

        // Inspector controls
        const inspectorControls = el(InspectorControls, {},
            el(PanelBody, {
                title: __('${this.generateBlockTitle(componentName)} Settings', '${themeName}'),
                initialOpen: true
            },
                ${this.generateInspectorControlsVanilla(componentConfig.parameters || [])}
            )
        );

        // Block preview
        const blockPreview = el('div', blockProps,
            el('div', {
                className: '${themePrefix}-block-preview',
                style: {
                    border: '2px dashed #ddd',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    margin: '10px 0'
                }
            },
                el('h3', { style: { margin: '0 0 10px 0', color: '#333', fontSize: '16px' } },
                    __('${this.generateBlockTitle(componentName)}', '${themeName}')
                ),
                el('p', { style: { margin: '0 0 15px 0', color: '#666', fontSize: '14px' } },
                    __('Component preview - will render on frontend using server-side PHP.', '${themeName}')
                ),
                el('div', {
                    className: 'component-preview',
                    style: {
                        marginTop: '15px',
                        padding: '10px',
                        background: 'white',
                        borderRadius: '4px',
                        border: '1px solid #eee',
                        fontSize: '12px'
                    }
                },
                    el('p', { style: { margin: '5px 0' } },
                        el('strong', {}, 'Componente: '),
                        '${componentName}'
                    ),
                    el('p', { style: { margin: '5px 0' } },
                        el('strong', {}, 'Tipo: '),
                        '${componentConfig.type || 'component'}'
                    ),
                    el('p', { style: { margin: '5px 0', fontStyle: 'italic' } },
                        'El componente se renderizará usando la función PHP existente.'
                    )
                )
            )
        );

        return el(Fragment, {},
            inspectorControls,
            blockPreview
        );
    }

    // ✅ WORDPRESS BEST PRACTICE: Registrar con metadata completa
    // Cuando usas server-side rendering, JavaScript necesita toda la metadata

    wp.domReady(function() {
        console.log('📦 Registrando bloque ${themePrefix}/${componentName}');

        try {
            wp.blocks.registerBlockType('${themePrefix}/${componentName}', {
                title: '${this.generateBlockTitle(componentName)}',
                description: '${this.generateBlockTitle(componentName)} component from the ${themeName}',
                category: '${themePrefix}-blocks',
                icon: 'admin-page',
                keywords: ['${componentName}', '${themeName.toLowerCase()}', '${themePrefix}', 'component'],
                attributes: {${this.generateAttributesForJS(componentConfig.parameters || [])}
                },
                supports: {
                    html: false,
                    anchor: true,
                    customClassName: true,
                    className: true,
                    reusable: true,
                    inserter: true,
                    multiple: ${componentConfig.type !== 'static' ? 'true' : 'false'}
                },
                edit: Edit,
                save: function() {
                    // ✅ OBLIGATORIO: save retorna null para server-side rendering
                    return null;
                }
            });
            console.log('✅ ${this.generateBlockTitle(componentName)} registrado correctamente');
        } catch (error) {
            console.error('❌ Error registrando ${componentName}:', error);
            console.error('Detalles:', error.message);
        }
    });

})();`;

        const editJsPath = path.join(blockDir, 'edit.js');
        fs.writeFileSync(editJsPath, editJs);
    }

    /**
     * Genera save.js (retorna null porque usa server-side rendering)
     */
    generateBlockSave(blockDir, componentName, componentConfig) {
        const saveJs = `/**
 * Save Script para ${componentName}
 * Usa server-side rendering (render.php)
 */

(function() {
    'use strict';

    // No es necesario registro aquí, ya se maneja en edit.js
    // Esta función se usa como placeholder para compatibilidad

})();`;

        const saveJsPath = path.join(blockDir, 'save.js');
        fs.writeFileSync(saveJsPath, saveJs);
    }

    /**
     * Genera array de atributos para registro de bloque WordPress
     */
    generateBlockAttributesArray(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters.map(param => {
            const type = this.mapToWordPressType(param.type);
            const defaultValue = DefaultValueParser.toPHP(param.default, param.type, 'array_value');
            return `
            '${param.name}' => array( 'type' => '${type}', 'default' => ${defaultValue} )`;
        }).join(',');
    }

    /**
     * Genera mapeo de atributos para Web Component
     */
    generateComponentAttributesMapping(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters.map(param => {
            const sanitizeFunction = param.name.toLowerCase().includes('image') || param.name.toLowerCase().includes('url') ? 'esc_url' : 'esc_attr';
            return `
    if ( ! empty( $attributes['${param.name}'] ) ) {
        $component_attrs[] = sprintf( '${this.camelToKebab(param.name)}="%s"', ${sanitizeFunction}( $attributes['${param.name}'] ) );
    }`;
        }).join('');
    }

    /**
     * Mapea tipos Lit Component a tipos WordPress
     */
    mapToWordPressType(litType) {
        switch (litType) {
            case 'Boolean':
                return 'boolean';
            case 'Number':
                return 'number';
            case 'Array':
                return 'array';
            case 'Object':
                return 'object';
            default:
                return 'string';
        }
    }

    /**
     * Convierte camelCase a kebab-case
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Genera parámetros para llamada PHP del componente
     */
    generatePhpCallParameters(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters.map(param => {
            const phpDefault = DefaultValueParser.toPHP(param.default, param.type, 'function_param');
            return `isset( $sanitized_attributes['${param.name}'] ) ? $sanitized_attributes['${param.name}'] : ${phpDefault}`;
        }).join(', ');
    }

    /**
     * Genera extracciones de atributos para render.php
     * Crea variables PHP desde $attributes array
     */
    generateAttributeExtractions(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters.map(param => {
            const phpDefault = DefaultValueParser.toPHP(param.default, param.type, 'function_param');
            return `$${param.name} = isset( $attributes['${param.name}'] ) ? $attributes['${param.name}'] : ${phpDefault};`;
        }).join('\n');
    }

    /**
     * Genera lista de parámetros para llamada de función
     * Retorna nombres de variables separados por comas
     */
    generateFunctionCallParams(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters.map(param => `$${param.name}`).join(', ');
    }

    /**
     * Genera style.css para el frontend del bloque
     * ✅ WORDPRESS BEST PRACTICE: Reutiliza CSS del componente Lit original
     */
    generateBlockStyle(blockDir, componentName) {
        const themePrefix = this.config.themePrefix || 'ds';

        // ✅ REUTILIZACIÓN: Buscar CSS del componente Lit original - FAIL FAST
        const componentCssPath = path.join(process.cwd(), 'src', 'components', componentName, `${componentName}.css`);

        if (!fs.existsSync(componentCssPath)) {
            throw new Error(`❌ GUTENBERG BLOCK ERROR: CSS del componente Lit NO encontrado
📍 Componente: ${componentName}
📂 Ruta esperada: ${componentCssPath}
💡 Solución: Crear ${componentName}.css en src/components/${componentName}/
🚨 SIN FALLBACKS: CSS del componente Lit es OBLIGATORIO para bloques Gutenberg`);
        }

        const componentCss = fs.readFileSync(componentCssPath, 'utf8');
        console.log(`✅ CSS reutilizado desde componente Lit: ${componentName}.css`);

        const styleCss = `/**
 * Frontend styles for ${componentName} block
 * Generated automatically from Lit Component
 * WordPress Standards Compliant
 *
 * ✅ REUTILIZACIÓN: Incluye CSS original del componente Lit
 * Fuente: src/components/${componentName}/${componentName}.css
 */

/* ====================================
 * CSS DEL COMPONENTE LIT ORIGINAL
 * Reutilizado para mantener consistencia entre Storybook y WordPress
 * ==================================== */
${componentCss}

/* ====================================
 * CSS ESPECÍFICO DE GUTENBERG BLOCK
 * Alignment support y WordPress-specific styles
 * ==================================== */

/* Block container */
.wp-block-${themePrefix}-${componentName} {
    /* Estilos del componente aplicados arriba */
    display: block;
}

/* Block wrapper with alignment support */
.wp-block-${themePrefix}-${componentName}.alignwide {
    width: 100vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
}

.wp-block-${themePrefix}-${componentName}.alignfull {
    width: 100vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
}

/* Responsive considerations */
@media (max-width: 768px) {
    .wp-block-${themePrefix}-${componentName} {
        /* Mobile-specific adjustments if needed */
    }
}`;

        const styleCssPath = path.join(blockDir, 'style.css');
        fs.writeFileSync(styleCssPath, styleCss);
    }

    /**
     * Genera editor.css específico para el editor de bloques
     */
    generateBlockEditorStyle(blockDir, componentName) {
        const themePrefix = this.config.themePrefix || 'ds';

        const editorCss = `/**
 * Editor-specific styles for ${componentName} block
 * Generated automatically from Lit Component
 * WordPress Standards Compliant
 */

/* Block preview in editor */
.${themePrefix}-${componentName}-block {
    position: relative;
}

.${themePrefix}-${componentName}-block .${themePrefix}-block-preview {
    border: 2px dashed #ddd;
    padding: 20px;
    text-align: center;
    background-color: #f9f9f9;
    border-radius: 4px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.${themePrefix}-${componentName}-block .${themePrefix}-block-preview h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
}

.${themePrefix}-${componentName}-block .${themePrefix}-block-preview p {
    margin: 0;
    color: #666;
    font-size: 14px;
    line-height: 1.4;
}

.${themePrefix}-${componentName}-block .component-preview {
    margin-top: 15px;
    padding: 10px;
    background: white;
    border-radius: 4px;
    border: 1px solid #eee;
    font-size: 12px;
    max-width: 100%;
}

.${themePrefix}-${componentName}-block .block-debug-info {
    margin-top: 10px;
    font-size: 11px;
    color: #999;
}

.${themePrefix}-${componentName}-block .block-debug-info pre {
    background: #f0f0f0;
    padding: 8px;
    border-radius: 3px;
    overflow: auto;
    max-height: 150px;
    font-size: 10px;
}

/* Selected state */
.${themePrefix}-${componentName}-block.is-selected .${themePrefix}-block-preview {
    border-color: #007cba;
    box-shadow: 0 0 0 1px #007cba;
}

/* Hover state */
.${themePrefix}-${componentName}-block:hover .${themePrefix}-block-preview {
    border-color: #bbb;
}

/* Responsive editor styles */
@media (max-width: 782px) {
    .${themePrefix}-${componentName}-block .${themePrefix}-block-preview {
        padding: 15px;
    }

    .${themePrefix}-${componentName}-block .${themePrefix}-block-preview h3 {
        font-size: 14px;
    }

    .${themePrefix}-${componentName}-block .${themePrefix}-block-preview p {
        font-size: 12px;
    }
}`;

        const editorCssPath = path.join(blockDir, 'editor.css');
        fs.writeFileSync(editorCssPath, editorCss);
    }

    /**
     * Genera index.php para registrar todos los bloques
     */
    generateBlocksIndex() {
        const functionPrefix = this.config.phpFunctionPrefix || this.config.functionPrefix || 'theme';
        const themePrefix = this.config.themePrefix || 'ds';
        const themeName = this.config.themeName || 'design-system';
        const themeDisplayName = this.config.themeDisplayName || 'Design System';

        const indexPhp = `<?php
/**
 * Gutenberg Blocks Registration
 * WordPress Standards Compliant
 * Generated automatically from Lit Components
 * ✅ FAIL-FAST: Robust error handling and validation
 *
 * @package ${themeName}
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Initialize blocks registration
 * ✅ WORDPRESS STANDARD: Proper initialization with fail-fast validation
 */
function ${functionPrefix}_init_gutenberg_blocks() {
    // ✅ FAIL-FAST: Validate Gutenberg availability
    if ( ! function_exists( 'register_block_type' ) ) {
        throw new Exception('❌ GUTENBERG NO DISPONIBLE: register_block_type() function no existe');
    }

    // ✅ FAIL-FAST: Validate blocks directory
    $blocks_dir = get_template_directory() . '/blocks/';
    if ( ! is_dir( $blocks_dir ) ) {
        throw new Exception('❌ DIRECTORIO BLOQUES NO ENCONTRADO: /blocks/ no existe en ' . $blocks_dir);
    }

    ${functionPrefix}_register_gutenberg_blocks();
}
add_action( 'init', '${functionPrefix}_init_gutenberg_blocks' );

/**
 * ✅ CRÍTICO: FORZAR registro con hook adicional para asegurar ejecución
 * ✅ WORDPRESS BEST PRACTICE: Multiple hook registration para asegurar ejecución
 * Evita problemas donde el hook init puede no ejecutarse correctamente
 */
function ${functionPrefix}_force_register_blocks() {
    // ✅ FAIL-FAST: Validate Gutenberg availability
    if ( ! function_exists( 'register_block_type' ) ) {
        throw new Exception('❌ GUTENBERG NO DISPONIBLE en wp_loaded: register_block_type() function no existe');
    }

    // ✅ FAIL-FAST: Validate blocks directory
    $blocks_dir = get_template_directory() . '/blocks/';
    if ( ! is_dir( $blocks_dir ) ) {
        throw new Exception('❌ DIRECTORIO BLOQUES NO ENCONTRADO en wp_loaded: /blocks/ no existe en ' . $blocks_dir);
    }

    ${functionPrefix}_register_gutenberg_blocks();
}
add_action( 'wp_loaded', '${functionPrefix}_force_register_blocks' );

/**
 * Auto-discovery and registration of blocks
 * ✅ WORDPRESS STANDARD: Safe block discovery with fail-fast validation
 */
function ${functionPrefix}_register_gutenberg_blocks() {
    $blocks_dir = get_template_directory() . '/blocks/';

    // ✅ FAIL-FAST: Validate directory (double check)
    if ( ! is_dir( $blocks_dir ) ) {
        throw new Exception('❌ DIRECTORIO BLOQUES INVÁLIDO: /blocks/ no es un directorio válido');
    }

    // ✅ FAIL-FAST: Check directory is readable
    if ( ! is_readable( $blocks_dir ) ) {
        throw new Exception('❌ DIRECTORIO BLOQUES NO LEGIBLE: /blocks/ no tiene permisos de lectura');
    }

    // ✅ WORDPRESS STANDARD: Use directory iterator for better performance
    $iterator = new DirectoryIterator( $blocks_dir );
    $registered_blocks = 0;
    $failed_blocks = array();

    foreach ( $iterator as $dir ) {
        if ( $dir->isDot() || ! $dir->isDir() ) {
            continue;
        }

        $block_name = $dir->getFilename();
        $block_path = $dir->getPathname();
        $block_json = $block_path . '/block.json';
        $block_index = $block_path . '/index.php';

        try {
            // ✅ FAIL-FAST: Validate block structure
            if ( ! file_exists( $block_json ) ) {
                throw new Exception("block.json no encontrado en {$block_path}");
            }

            if ( ! file_exists( $block_index ) ) {
                throw new Exception("index.php no encontrado en {$block_path}");
            }

            // ✅ FAIL-FAST: Validate files are readable
            if ( ! is_readable( $block_json ) ) {
                throw new Exception("block.json no es legible en {$block_json}");
            }

            if ( ! is_readable( $block_index ) ) {
                throw new Exception("index.php no es legible en {$block_index}");
            }

            // ✅ WORDPRESS STANDARD: Validate block.json schema
            $block_data = json_decode( file_get_contents( $block_json ), true );
            if ( json_last_error() !== JSON_ERROR_NONE ) {
                throw new Exception("block.json JSON inválido: " . json_last_error_msg());
            }

            // ✅ FAIL-FAST: Validate required block.json fields
            $required_fields = array('name', 'title', 'category');
            foreach ( $required_fields as $field ) {
                if ( empty( $block_data[$field] ) ) {
                    throw new Exception("block.json campo requerido '{$field}' faltante en {$block_name}");
                }
            }

            // Load and execute block registration
            require_once $block_index;
            $registered_blocks++;

        } catch ( Exception $e ) {
            $failed_blocks[] = "{$block_name}: " . $e->getMessage();

            // ✅ FAIL-FAST: En desarrollo, fallar inmediatamente
            if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
                throw new Exception("❌ ERROR CRÍTICO EN BLOQUE {$block_name}: " . $e->getMessage());
            }
        }
    }

    // ✅ LOGGING: Report results in development
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG && ! empty( $failed_blocks ) ) {
        error_log("⚠️ BLOQUES FALLIDOS: " . implode( ', ', $failed_blocks ));
    }

    // ✅ LOGGING: Success confirmation
    if ( $registered_blocks > 0 ) {
        error_log("✅ BLOQUES REGISTRADOS: {$registered_blocks} bloques procesados exitosamente");
    }
}

/**
 * Register custom block category
 * ✅ WORDPRESS STANDARD: Proper category registration using filter
 */
function ${functionPrefix}_register_block_category( $categories ) {
    // Agregar categoría al inicio del array
    return array_merge(
        array(
            array(
                'slug'  => '${themePrefix}-blocks',
                'title' => __( '${themeDisplayName}', '${themeName}' ),
                'icon'  => 'star-filled'
            )
        ),
        $categories
    );
}
add_filter( 'block_categories_all', '${functionPrefix}_register_block_category', 10, 1 );

/**
 * Enqueue block editor assets
 * ✅ WORDPRESS STANDARD: Conditional asset loading with cache busting
 */
function ${functionPrefix}_enqueue_block_editor_assets() {
    // ✅ Este hook solo se ejecuta en el editor de bloques, no necesita validación adicional
    // El hook 'enqueue_block_editor_assets' ya garantiza que estamos en el contexto correcto

    // Enqueue global editor CSS
    $css_path = get_template_directory() . '/assets/css/blocks-editor.css';

    if ( file_exists( $css_path ) ) {
        wp_enqueue_style(
            '${themePrefix}-blocks-editor',
            get_template_directory_uri() . '/assets/css/blocks-editor.css',
            array(),
            filemtime( $css_path )
        );
    }

    // Enqueue all block editor scripts
    ${functionPrefix}_enqueue_individual_block_scripts();
}
add_action( 'enqueue_block_editor_assets', '${functionPrefix}_enqueue_block_editor_assets' );

/**
 * Validación de Web Components en frontend
 * ✅ WORDPRESS BEST PRACTICE: Solo en WP_DEBUG para debugging
 */
function ${functionPrefix}_validate_webcomponents_loaded() {
    // Solo ejecutar si WP_DEBUG está activo y el usuario puede editar
    if ( ! ( defined( 'WP_DEBUG' ) && WP_DEBUG ) || ! current_user_can( 'edit_posts' ) ) {
        return;
    }

    ?>
    <script>
    (function() {
        window.addEventListener('DOMContentLoaded', function() {
            var requiredComponents = ['${themePrefix}-course-card', '${themePrefix}-hero-section', '${themePrefix}-testimonials', '${themePrefix}-feature-grid', '${themePrefix}-interactive-gallery'];
            var missing = [];

            requiredComponents.forEach(function(tagName) {
                if (!customElements.get(tagName)) {
                    missing.push(tagName);
                }
            });

            if (missing.length > 0) {
                console.error('❌ WEB COMPONENTS ERROR: Los siguientes componentes NO están registrados:');
                console.error(missing);
                console.error('📍 Verifica que toulouse-ds.umd.js se cargó correctamente en asset-enqueue.php');
                console.error('💡 Revisa errores de JavaScript en la consola');
            } else {
                console.log('✅ Todos los Web Components de bloques Gutenberg están registrados correctamente');
            }
        });
    })();
    </script>
    <?php
}
add_action( 'wp_footer', '${functionPrefix}_validate_webcomponents_loaded', 999 );

/**
 * Enqueue individual block editor scripts
 * ✅ WORDPRESS STANDARD: Register and enqueue each block's JavaScript
 */
function ${functionPrefix}_enqueue_individual_block_scripts() {
    $blocks_dir = get_template_directory() . '/blocks/';

    if ( ! is_dir( $blocks_dir ) ) {
        return;
    }

    $iterator = new DirectoryIterator( $blocks_dir );

    foreach ( $iterator as $dir ) {
        if ( $dir->isDot() || ! $dir->isDir() ) {
            continue;
        }

        $block_name = $dir->getFilename();
        $block_path = $dir->getPathname();
        $edit_js_path = $block_path . '/edit.js';
        $editor_css_path = $block_path . '/editor.css';

        // Enqueue block editor JavaScript
        if ( file_exists( $edit_js_path ) ) {
            wp_enqueue_script(
                '${themePrefix}-' . $block_name . '-editor',
                get_template_directory_uri() . '/blocks/' . $block_name . '/edit.js',
                array( 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n', 'wp-media-utils', 'media-upload' ),
                filemtime( $edit_js_path ),
                true
            );

            // Set script translations if available
            wp_set_script_translations(
                '${themePrefix}-' . $block_name . '-editor',
                '${themeName}',
                get_template_directory() . '/languages'
            );
        }

        // Enqueue block-specific editor CSS
        if ( file_exists( $editor_css_path ) ) {
            wp_enqueue_style(
                '${themePrefix}-' . $block_name . '-editor-style',
                get_template_directory_uri() . '/blocks/' . $block_name . '/editor.css',
                array(),
                filemtime( $editor_css_path )
            );
        }
    }
}

/**
 * Add theme support for block editor features
 * ✅ WORDPRESS STANDARD: Enable modern block editor features
 */
function ${functionPrefix}_add_block_editor_support() {
    // Add theme support for responsive embeds
    add_theme_support( 'responsive-embeds' );

    // Add theme support for editor styles
    add_theme_support( 'editor-styles' );

    // Add theme support for wide and full alignment
    add_theme_support( 'align-wide' );

    // Add theme support for block color palettes
    add_theme_support( 'editor-color-palette' );
}
add_action( 'after_setup_theme', '${functionPrefix}_add_block_editor_support' );

/**
 * Global fallback function for block render errors
 * ✅ WORDPRESS STANDARD: Graceful error handling for all blocks
 */
if ( ! function_exists( '${functionPrefix}_render_block_fallback' ) ) {
    function ${functionPrefix}_render_block_fallback( $component_name, $error_message = '' ) {
        // Only show detailed errors to users who can edit
        if ( current_user_can( 'edit_posts' ) ) {
            return sprintf(
                '<div class="wp-block-error ${themePrefix}-block-error">
                    <p><strong>%s</strong></p>
                    <p>%s</p>
                    %s
                </div>',
                esc_html__( 'Block Render Error', '${themeName}' ),
                sprintf(
                    esc_html__( 'Component "%s" could not be rendered.', '${themeName}' ),
                    esc_html( $component_name )
                ),
                ! empty( $error_message ) ? '<p><small>' . esc_html( $error_message ) . '</small></p>' : ''
            );
        }

        // For non-editors, return empty string (graceful degradation)
        return '';
    }
}
`;

        const indexPhpPath = path.join(this.blocksDir, 'index.php');
        fs.writeFileSync(indexPhpPath, indexPhp);
    }

    /**
     * Convierte parámetros de componente a attributes de Gutenberg
     */
    convertParametersToAttributes(parameters) {
        const attributes = {};

        parameters.forEach(param => {
            const attrType = this.mapTypeToGutenbergType(param.type);

            attributes[param.name] = {
                type: attrType,
                default: DefaultValueParser.toJS(param.default, param.type, 'gutenberg')
            };
        });

        return attributes;
    }

    /**
     * Convierte arrayFields a properties para Gutenberg
     */
    convertArrayFieldsToProperties(fieldConfig) {
        const properties = {};

        fieldConfig.forEach(field => {
            properties[field.name] = {
                type: this.mapTypeToGutenbergType(field.type)
            };
        });

        return properties;
    }

    /**
     * Mapea tipos de componente a tipos de Gutenberg
     */
    mapTypeToGutenbergType(type) {
        const typeMap = {
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'array': 'array',
            'object': 'object'
        };

        return typeMap[type] || 'string';
    }

    // DEPRECATED: Removed parseDefaultValue - using DefaultValueParser.toJS instead

    /**
     * Genera título legible para el bloque
     */
    generateBlockTitle(componentName) {
        return componentName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Obtiene icono para el bloque según el tipo
     */
    getBlockIcon(type) {
        const iconMap = {
            'static': 'admin-page',
            'iterative': 'admin-post',
            'aggregated': 'admin-tools',
            'comprehensive': 'admin-appearance'
        };

        return iconMap[type] || 'admin-generic';
    }

    /**
     * Genera destructuring de attributes para edit.js
     */
    generateAttributeDestructuring(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }
        return parameters.map(param => param.name).join(', ');
    }

    /**
     * Genera controles del inspector usando wp.element.createElement (vanilla JS)
     */
    generateInspectorControlsVanilla(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        const controls = parameters.map(param => {
            const themeName = this.config.themeName || 'design-system';

            switch (param.type) {
                case 'boolean':
                    return `el(ToggleControl, {
                    label: __('${this.generateFieldLabel(param.name)}', '${themeName}'),
                    checked: ${param.name},
                    onChange: function(value) { setAttributes({ ${param.name}: value }); }
                })`;

                case 'number':
                    return `el(RangeControl, {
                    label: __('${this.generateFieldLabel(param.name)}', '${themeName}'),
                    value: ${param.name},
                    onChange: function(value) { setAttributes({ ${param.name}: value }); },
                    min: 0,
                    max: 100
                })`;

                default:
                    // Check if this is an image field
                    if (param.name.toLowerCase().includes('image') || param.name.toLowerCase().includes('img')) {
                        return `el('div', { style: { marginBottom: '16px' } },
                    el('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '600' } },
                        __('${this.generateFieldLabel(param.name)}', '${themeName}')
                    ),
                    el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        el(TextControl, {
                            value: ${param.name},
                            onChange: function(value) { setAttributes({ ${param.name}: value }); },
                            placeholder: __('Enter image URL or upload...', '${themeName}')
                        }),
                        el('button', {
                            className: 'button button-secondary',
                            onClick: function() {
                                if (wp.media) {
                                    const mediaUploader = wp.media({
                                        title: __('Select Image', '${themeName}'),
                                        multiple: false,
                                        library: { type: 'image' }
                                    });
                                    mediaUploader.on('select', function() {
                                        const attachment = mediaUploader.state().get('selection').first().toJSON();
                                        setAttributes({ ${param.name}: attachment.url });
                                    });
                                    mediaUploader.open();
                                }
                            }
                        }, __('Upload', '${themeName}'))
                    ),
                    ${param.name} && el('img', {
                        src: ${param.name},
                        style: { maxWidth: '100%', height: 'auto', marginTop: '8px', border: '1px solid #ddd', borderRadius: '4px' },
                        alt: __('Preview', '${themeName}')
                    })
                )`;
                    } else {
                        return `el(TextControl, {
                    label: __('${this.generateFieldLabel(param.name)}', '${themeName}'),
                    value: ${param.name},
                    onChange: function(value) { setAttributes({ ${param.name}: value }); }
                })`;
                    }
            }
        });

        return controls.join(',\n                ');
    }

    /**
     * Genera controles del inspector para edit.js (JSX - DEPRECATED)
     */
    generateInspectorControls(parameters) {
        return parameters.map(param => {
            switch (param.type) {
                case 'boolean':
                    return `                    <ToggleControl
                        label={__('${this.generateFieldLabel(param.name)}', '${this.config.themeName || 'design-system-theme'}')}
                        checked={${param.name}}
                        onChange={(value) => setAttributes({ ${param.name}: value })}
                    />`;

                case 'number':
                    return `                    <RangeControl
                        label={__('${this.generateFieldLabel(param.name)}', '${this.config.themeName || 'design-system-theme'}')}
                        value={${param.name}}
                        onChange={(value) => setAttributes({ ${param.name}: value })}
                        min={0}
                        max={100}
                    />`;

                default:
                    return `                    <TextControl
                        label={__('${this.generateFieldLabel(param.name)}', '${this.config.themeName || 'design-system-theme'}')}
                        value={${param.name}}
                        onChange={(value) => setAttributes({ ${param.name}: value })}
                    />`;
            }
        }).join('\n');
    }

    /**
     * Genera paneles para arrayFields
     */
    generateArrayFieldsPanels(arrayFields) {
        if (!arrayFields || Object.keys(arrayFields).length === 0) {
            return '';
        }

        return Object.keys(arrayFields).map((fieldName) => {
            return `                <PanelBody title={__('${this.generateFieldLabel(fieldName)}', '${this.config.themeName || 'design-system-theme'}')} initialOpen={false}>
                    <p>{__('Configuración de ${fieldName} (implementar editor de array)', '${this.config.themeName || 'design-system-theme'}')}</p>
                </PanelBody>`;
        }).join('\n');
    }

    /**
     * Genera preview del componente en el editor
     */
    generateComponentPreview(componentName, componentConfig) {
        return `                        <p><strong>Componente:</strong> ${componentName}</p>
                        <p><strong>Tipo:</strong> ${componentConfig.type}</p>
                        <p><em>El componente se renderizará en el frontend usando la función PHP existente.</em></p>`;
    }

    /**
     * Genera label legible para campos
     */
    generateFieldLabel(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Genera atributos para registro JavaScript del bloque
     */
    generateAttributesForJS(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return '\n' + parameters.map(param => {
            const type = this.mapTypeToGutenbergType(param.type);
            const defaultValue = DefaultValueParser.toJS(param.default, param.type, 'gutenberg');
            return `                    ${param.name}: {
                        type: '${type}',
                        default: ${JSON.stringify(defaultValue)}
                    }`;
        }).join(',\n');
    }

    /**
     * Genera validación de attributes requeridos para el editor
     */
    generateAttributeValidation(parameters) {
        const requiredParams = parameters.filter(param =>
            param.required || (param.type === 'string' && !param.default)
        );

        if (requiredParams.length === 0) {
            return 'true';
        }

        const validations = requiredParams.map(param => {
            switch (param.type) {
                case 'string':
                    return `${param.name} && ${param.name}.trim() !== ''`;
                case 'number':
                    return `typeof ${param.name} === 'number' && !isNaN(${param.name})`;
                case 'boolean':
                    return `typeof ${param.name} === 'boolean'`;
                default:
                    return `${param.name} != null`;
            }
        });

        return validations.join(' && ');
    }

    /**
     * Genera ejemplo del bloque para la preview
     */
    generateBlockExample(parameters) {
        const exampleAttrs = parameters.reduce((attrs, param) => {
            attrs[param.name] = DefaultValueParser.toJS(param.default, param.type, 'gutenberg_example');
            return attrs;
        }, {});

        return `            attributes: ${JSON.stringify(exampleAttrs, null, 16).replace(/^/gm, '            ')}`;
    }

    /**
     * Genera CSS para el editor de Gutenberg
     */
    generateBlocksEditorCSS() {
        const cssContent = `/**
 * Estilos para el editor de Gutenberg blocks
 * Generado automáticamente desde componentes Lit
 * ${this.config.themeDisplayName || 'Design System'}
 *
 * Componentes incluidos: ${this.getComponentsList()}
 * Generado: ${new Date().toISOString()}
 */

/* ====================================
 * ESTILOS GENERALES PARA BLOQUES DEL TEMA
 * Reutilizables y mantenibles
 * ==================================== */

/* Variables CSS para consistencia */
:root {
    --${this.config.themePrefix || 'ds'}-block-border-color: #ddd;
    --${this.config.themePrefix || 'ds'}-block-border-color-hover: #bbb;
    --${this.config.themePrefix || 'ds'}-block-border-color-selected: #007cba;
    --${this.config.themePrefix || 'ds'}-block-bg-preview: #f9f9f9;
    --${this.config.themePrefix || 'ds'}-block-bg-component: white;
    --${this.config.themePrefix || 'ds'}-block-text-primary: #333;
    --${this.config.themePrefix || 'ds'}-block-text-secondary: #666;
    --${this.config.themePrefix || 'ds'}-block-text-muted: #999;
    --${this.config.themePrefix || 'ds'}-block-border-radius: 4px;
    --${this.config.themePrefix || 'ds'}-block-spacing-sm: 10px;
    --${this.config.themePrefix || 'ds'}-block-spacing-md: 15px;
    --${this.config.themePrefix || 'ds'}-block-spacing-lg: 20px;
}

/* Vista previa de bloques en editor */
.${this.config.themePrefix || 'ds'}-block-preview {
    border: 2px dashed var(--${this.config.themePrefix || 'ds'}-block-border-color);
    padding: var(--${this.config.themePrefix || 'ds'}-block-spacing-lg);
    text-align: center;
    background-color: var(--${this.config.themePrefix || 'ds'}-block-bg-preview);
    border-radius: var(--${this.config.themePrefix || 'ds'}-block-border-radius);
    margin: var(--${this.config.themePrefix || 'ds'}-block-spacing-sm) 0;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: border-color 0.2s ease;
}

.${this.config.themePrefix || 'ds'}-block-preview h3 {
    margin: 0 0 var(--${this.config.themePrefix || 'ds'}-block-spacing-sm) 0;
    color: var(--${this.config.themePrefix || 'ds'}-block-text-primary);
    font-size: 16px;
    font-weight: 600;
}

.${this.config.themePrefix || 'ds'}-block-preview p {
    margin: 0;
    color: var(--${this.config.themePrefix || 'ds'}-block-text-secondary);
    font-size: 14px;
    line-height: 1.4;
}

/* Vista previa del componente */
.component-preview {
    margin-top: var(--${this.config.themePrefix || 'ds'}-block-spacing-md);
    padding: var(--${this.config.themePrefix || 'ds'}-block-spacing-sm);
    background: var(--${this.config.themePrefix || 'ds'}-block-bg-component);
    border-radius: var(--${this.config.themePrefix || 'ds'}-block-border-radius);
    border: 1px solid var(--${this.config.themePrefix || 'ds'}-block-border-color);
    font-size: 12px;
    max-width: 100%;
}

/* Estados de interacción */
.${this.config.themePrefix || 'ds'}-block-preview:hover {
    border-color: var(--${this.config.themePrefix || 'ds'}-block-border-color-hover);
}

.is-selected .${this.config.themePrefix || 'ds'}-block-preview {
    border-color: var(--${this.config.themePrefix || 'ds'}-block-border-color-selected);
    box-shadow: 0 0 0 1px var(--${this.config.themePrefix || 'ds'}-block-border-color-selected);
}

/* Estilos de error - Sin hardcode, usando variables CSS */
.wp-block-error,
.${this.config.themePrefix || 'ds'}-block-error {
    padding: var(--${this.config.themePrefix || 'ds'}-block-spacing-lg);
    border: 2px dashed var(--${this.config.themePrefix || 'ds'}-block-border-color);
    text-align: center;
    color: var(--${this.config.themePrefix || 'ds'}-block-text-secondary);
    background: var(--${this.config.themePrefix || 'ds'}-block-bg-preview);
    border-radius: var(--${this.config.themePrefix || 'ds'}-block-border-radius);
    margin: 1rem 0;
}

.wp-block-error p,
.${this.config.themePrefix || 'ds'}-block-error p {
    margin: 0.5rem 0;
}

.wp-block-error strong,
.${this.config.themePrefix || 'ds'}-block-error strong {
    color: var(--${this.config.themePrefix || 'ds'}-block-text-primary);
}

/* ====================================
 * ESTILOS ESPECÍFICOS POR BLOQUE
 * Generados dinámicamente basado en:
 * - Tipo de componente (static, iterative, aggregated, comprehensive)
 * - Hash del nombre para variaciones únicas
 * ==================================== */
${this.generateBlockSpecificStyles()}

/* Responsive para editor */
@media (max-width: 782px) {
    .${this.config.themePrefix || 'ds'}-block-preview {
        padding: 15px;
    }

    .${this.config.themePrefix || 'ds'}-block-preview h3 {
        font-size: 14px;
    }

    .${this.config.themePrefix || 'ds'}-block-preview p {
        font-size: 12px;
    }
}`;

        // Crear directorio assets/css si no existe
        const themePath = path.join(this.outputDir, this.themeName);
        const assetsDir = path.join(themePath, 'assets', 'css');

        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        const cssPath = path.join(assetsDir, 'blocks-editor.css');
        fs.writeFileSync(cssPath, cssContent);

        console.log('✅ blocks-editor.css generado automáticamente');
    }

    /**
     * Genera estilos específicos para cada bloque dinámicamente
     */
    generateBlockSpecificStyles() {
        return Object.entries(this.metadata)
            .filter(([componentName]) => componentName !== 'wordpress_plugins')
            .map(([componentName, componentConfig]) => {
                const colors = this.generateColorsForComponent(componentName, componentConfig);
                const parametersCount = componentConfig.parameters ? componentConfig.parameters.length : 0;
                const arrayFieldsCount = componentConfig.arrayFields ? Object.keys(componentConfig.arrayFields).length : 0;

                return `/* ${componentName} (${componentConfig.type}) - ${parametersCount} params, ${arrayFieldsCount} array fields */
.${this.config.themePrefix || 'ds'}-${componentName}-block .${this.config.themePrefix || 'ds'}-block-preview {
    background-color: ${colors.bg};
    border-color: ${colors.border};
}`;
            })
            .join('\n\n');
    }

    /**
     * Genera colores dinámicos para cada componente basado en su tipo y nombre
     */
    generateColorsForComponent(componentName, componentConfig) {
        // Paleta de colores por tipo de componente
        const typeColorMap = {
            'static': { hue: 200, lightness: 95, saturation: 80 },      // Azul claro
            'iterative': { hue: 120, lightness: 96, saturation: 70 },  // Verde claro
            'aggregated': { hue: 45, lightness: 92, saturation: 85 },  // Amarillo claro
            'comprehensive': { hue: 280, lightness: 97, saturation: 75 } // Púrpura claro
        };

        // Color base por tipo
        const baseColor = typeColorMap[componentConfig.type] ||
                         { hue: 220, lightness: 95, saturation: 60 };

        // Generar variación única basada en el nombre del componente
        const nameHash = this.hashStringToNumber(componentName);
        const hueVariation = (nameHash % 60) - 30; // Variación de ±30 grados
        const finalHue = (baseColor.hue + hueVariation + 360) % 360;

        // Generar colores para background y border
        const bgColor = `hsl(${finalHue}, ${baseColor.saturation}%, ${baseColor.lightness}%)`;
        const borderColor = `hsl(${finalHue}, ${Math.min(baseColor.saturation + 20, 100)}%, ${baseColor.lightness - 30}%)`;

        return {
            bg: bgColor,
            border: borderColor
        };
    }

    /**
     * Convierte string a número hash para generar variaciones consistentes
     */
    hashStringToNumber(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Obtiene lista de componentes para documentación
     */
    getComponentsList() {
        return Object.entries(this.metadata)
            .filter(([componentName]) => componentName !== 'wordpress_plugins')
            .map(([componentName, componentConfig]) =>
                `${componentName} (${componentConfig.type})`
            )
            .join(', ');
    }

    /**
     * Genera la lista de bloques para registro de scripts PHP
     */
    generateBlockScriptsList() {
        const themePrefix = this.config.themePrefix || 'ds';

        return Object.keys(this.metadata)
            .filter(componentName => componentName !== 'wordpress_plugins')
            .map(componentName => {
                return `
        array(
            'name' => '${componentName}',
            'editor_handle' => '${themePrefix}-${componentName}-editor',
            'frontend_handle' => '${themePrefix}-${componentName}-frontend'
        )`;
            }).join(',');
    }

    /**
     * Genera hook para functions.php
     */
    generateFunctionsHook() {
        return `
// 🧩 Gutenberg Blocks - Componentes Lit como bloques
require_once get_template_directory() . '/blocks/index.php';
`;
    }
}

module.exports = GutenbergConverter;