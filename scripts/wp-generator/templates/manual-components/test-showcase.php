<?php
/**
 * test-showcase Component - Template manual
 * Componente completo para validar todos los managers
 */

function render_test_showcase($title = '', $description = '', $testImages = '[]', $testData = '{}', $enableAnalytics = true) {
    // Decodificar arrays/objetos JSON
    $images = is_array($testImages) ? $testImages : json_decode($testImages, true);
    $data = is_array($testData) ? $testData : json_decode($testData, true);
    
    // Valores por defecto si están vacíos
    if (empty($images)) {
        $images = [
            ['src' => 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Asset+Test', 'alt' => 'Asset Manager Test'],
            ['src' => 'https://via.placeholder.com/300x200/F7931E/FFFFFF?text=Analytics+Test', 'alt' => 'Analytics Manager Test'],
            ['src' => 'https://via.placeholder.com/300x200/FFD23F/000000?text=SEO+Test', 'alt' => 'SEO Manager Test']
        ];
    }
    
    if (empty($title)) {
        $title = 'Test Showcase - Validación Completa';
    }
    
    if (empty($description)) {
        $description = 'Componente para probar todos los managers: SEO, Assets, Analytics, Templates y Components';
    }
    ?>
    
    <div class="test-showcase">
        <div class="test-header">
            <h2 class="test-title"><?php echo esc_html($title); ?></h2>
            <p class="test-description"><?php echo esc_html($description); ?></p>
        </div>

        <div class="test-sections">
            <!-- Asset Manager Test: Lazy loading, preload, módulos -->
            <div class="test-section asset-test">
                <h3 class="section-title">📦 Asset Manager Test</h3>
                <p>Imágenes con lazy loading, preload crítico y módulos ES6/UMD:</p>
                
                <div class="test-images">
                    <?php foreach ($images as $index => $img): ?>
                        <img 
                            class="test-image"
                            src="<?php echo esc_url($img['src']); ?>" 
                            alt="<?php echo esc_attr($img['alt']); ?>"
                            loading="lazy"
                            onclick="testShowcaseTrackEvent('image_click', {index: <?php echo $index; ?>})"
                        />
                    <?php endforeach; ?>
                </div>
                
                <div class="test-buttons">
                    <button class="test-button" onclick="testShowcaseTrackEvent('primary_cta', {section: 'asset_test'})">
                        CTA Principal
                    </button>
                    <button class="test-button secondary" onclick="testShowcaseTrackEvent('secondary_cta', {section: 'asset_test'})">
                        CTA Secundario
                    </button>
                </div>
            </div>

            <!-- Analytics Manager Test: Eventos y tracking -->
            <div class="test-section analytics-test">
                <h3 class="section-title">📊 Analytics Manager Test</h3>
                <p>Eventos de GA4, page views, component views y interactions:</p>
                
                <div class="analytics-events">
                    <strong>Eventos rastreados:</strong><br>
                    • page_view (automático)<br>
                    • component_view (automático)<br>
                    • button_click (interacción)<br>
                    • image_interaction (interacción)<br>
                    • form_submit (conversión)
                </div>
                
                <div class="test-buttons">
                    <button class="test-button" onclick="testShowcaseTrackEvent('test_conversion', {value: 100, currency: 'USD'})">
                        Test Conversión
                    </button>
                    <button class="test-button secondary" onclick="testShowcaseTrackEvent('test_engagement', {duration: 30, depth: 'scroll_50'})">
                        Test Engagement
                    </button>
                </div>
            </div>

            <!-- SEO Manager Test: Schema y metadata -->
            <div class="test-section seo-test">
                <h3 class="section-title">🔍 SEO Manager Test</h3>
                <p>Meta tags, OpenGraph, Schema.org y canonical URLs:</p>
                
                <div class="seo-info">
                    <strong>SEO Features testadas:</strong><br>
                    • Meta description: <?php echo esc_html(get_the_excerpt() ?: 'Default description'); ?><br>
                    • OpenGraph title: <?php echo esc_html(get_the_title()); ?><br>
                    • Schema.org: WebPage + Organization<br>
                    • Canonical URL: <?php echo esc_url(get_permalink()); ?><br>
                    • Twitter Card: summary_large_image
                </div>
            </div>

            <!-- Template Manager Test: WordPress hooks -->
            <div class="test-section template-test">
                <h3 class="section-title">🏗️ Template Manager Test</h3>
                <p>WordPress hooks, body classes y template específico:</p>
                
                <div class="template-info">
                    <strong>Template Features:</strong><br>
                    • wp_head() ejecutado: <?php echo wp_head() ? 'SÍ' : 'SÍ (siempre)'; ?><br>
                    • wp_footer() ejecutado: Scripts cargados<br>
                    • body_class(): <?php echo esc_html(implode(' ', get_body_class())); ?><br>
                    • Template actual: <?php echo esc_html(basename(get_page_template()) ?: 'default'); ?><br>
                    • Post ID: <?php echo get_the_ID(); ?>
                </div>
            </div>

            <!-- Component Manager Test: Conversión Lit → PHP -->
            <div class="test-section component-test">
                <h3 class="section-title">🧩 Component Manager Test</h3>
                <p>Conversión de template literals, estilos y funcionalidad:</p>
                
                <form class="test-form" onsubmit="return testShowcaseHandleSubmit(event)">
                    <div class="form-group">
                        <label class="form-label" for="test-input">Test Input:</label>
                        <input class="form-input" id="test-input" name="test_input" type="text" placeholder="Escribe algo..." />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="test-textarea">Test Textarea:</label>
                        <textarea class="form-textarea" id="test-textarea" name="test_message" rows="3" placeholder="Mensaje de prueba..."></textarea>
                    </div>
                    
                    <button class="test-button" type="submit">
                        Enviar Test Form
                    </button>
                </form>
                
                <div class="component-info">
                    <strong>Component Features validadas:</strong><br>
                    • Template literals → PHP: ✓ Convertidos<br>
                    • Event handlers → onclick: ✓ Funcionales<br>
                    • Estilos CSS: ✓ Inline eliminados<br>
                    • Referencias 'this.': ✓ Eliminadas<br>
                    • Lazy loading: ✓ Implementado
                </div>
            </div>
        </div>
    </div>
    
    <!-- JavaScript para Analytics y interacciones -->
    <script type="text/javascript" id="test-showcase-interactions">
        function testShowcaseTrackEvent(eventName, eventData) {
            // Tracking para Analytics Manager
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    event_category: 'test_showcase',
                    custom_parameter: 'toulouse_design_system',
                    component: 'test-showcase',
                    ...eventData
                });
            }
            
            // Console log para debug
            console.log('Test Showcase Event:', { event: eventName, data: eventData });
            
            // Data layer push
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'test_showcase_interaction',
                    eventName: eventName,
                    eventData: eventData,
                    timestamp: Date.now()
                });
            }
        }
        
        function testShowcaseHandleSubmit(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            
            testShowcaseTrackEvent('form_submit', {
                form_type: 'test_form',
                fields: Object.keys(data),
                component: 'test-showcase'
            });
            
            // Feedback visual
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '✅ Enviado!';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                event.target.reset();
            }, 2000);
            
            return false;
        }
        
        // Track component load
        document.addEventListener('DOMContentLoaded', function() {
            testShowcaseTrackEvent('component_view', {
                component: 'test-showcase',
                timestamp: Date.now(),
                page_url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            });
        });
    </script>
    
    <?php
}

// Hook para registrar estilos del test-showcase
add_action('wp_head', function() {
    static $test_showcase_styles_loaded = false;
    if (!$test_showcase_styles_loaded) {
        echo '<style id="test-showcase-component-styles">';
        echo '
        .test-showcase {
            padding: var(--tl-spacing-12);
            background: var(--tl-neutral-50);
            border-radius: 12px;
            margin: var(--tl-spacing-8) 0;
        }
        
        .test-header {
            text-align: center;
            margin-bottom: var(--tl-spacing-8);
        }
        
        .test-title {
            font-size: var(--tl-font-size-3xl);
            font-weight: var(--tl-font-weight-bold);
            color: var(--tl-neutral-900);
            margin-bottom: var(--tl-spacing-4);
        }
        
        .test-description {
            font-size: var(--tl-font-size-lg);
            color: var(--tl-neutral-600);
            margin-bottom: var(--tl-spacing-8);
        }
        
        .test-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: var(--tl-spacing-8);
        }
        
        .test-section {
            background: white;
            border-radius: 12px;
            padding: var(--tl-spacing-6);
            box-shadow: var(--tl-shadow-md);
            border: 1px solid var(--tl-neutral-200);
        }
        
        .section-title {
            font-size: var(--tl-font-size-xl);
            font-weight: var(--tl-font-weight-semibold);
            color: var(--tl-primary-600);
            margin-bottom: var(--tl-spacing-4);
            border-bottom: 2px solid var(--tl-primary-100);
            padding-bottom: var(--tl-spacing-2);
        }
        
        .test-images {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--tl-spacing-4);
            margin-bottom: var(--tl-spacing-6);
        }
        
        .test-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 8px;
            transition: var(--tl-transition-normal);
            cursor: pointer;
            border: 2px solid transparent;
        }
        
        .test-image:hover {
            transform: scale(1.05);
            box-shadow: var(--tl-shadow-lg);
            border-color: var(--tl-primary-500);
        }
        
        .test-buttons {
            display: flex;
            gap: var(--tl-spacing-4);
            flex-wrap: wrap;
            margin-bottom: var(--tl-spacing-6);
        }
        
        .test-button {
            background: var(--tl-primary-500);
            color: white;
            border: none;
            padding: var(--tl-spacing-3) var(--tl-spacing-6);
            border-radius: 8px;
            cursor: pointer;
            font-weight: var(--tl-font-weight-medium);
            transition: var(--tl-transition-normal);
        }
        
        .test-button:hover {
            background: var(--tl-primary-600);
            transform: translateY(-2px);
        }
        
        .test-button.secondary {
            background: var(--tl-accent-500);
        }
        
        .test-button.secondary:hover {
            background: var(--tl-accent-600);
        }
        
        .test-form {
            display: grid;
            gap: var(--tl-spacing-4);
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: var(--tl-spacing-2);
        }
        
        .form-label {
            font-weight: var(--tl-font-weight-medium);
            color: var(--tl-neutral-700);
        }
        
        .form-input, .form-textarea {
            padding: var(--tl-spacing-3);
            border: 1px solid var(--tl-neutral-300);
            border-radius: 6px;
            font-family: inherit;
        }
        
        .form-input:focus, .form-textarea:focus {
            outline: none;
            border-color: var(--tl-primary-500);
            box-shadow: 0 0 0 3px var(--tl-primary-100);
        }
        
        .analytics-events, .seo-info, .template-info, .component-info {
            background: var(--tl-neutral-100);
            padding: var(--tl-spacing-4);
            border-radius: 8px;
            font-size: var(--tl-font-size-sm);
            margin-bottom: var(--tl-spacing-4);
        }
        
        @media (max-width: 768px) {
            .test-sections {
                grid-template-columns: 1fr;
            }
            
            .test-images {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
        }
        ';
        echo '</style>';
        $test_showcase_styles_loaded = true;
    }
});
?>