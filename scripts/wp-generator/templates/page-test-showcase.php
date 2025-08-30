<?php
/**
 * Template Name: Test Showcase
 * Template para probar todos los managers del sistema
 */

get_header(); ?>

<main class="test-showcase-page">
    <div class="container">
        <div class="page-header">
            <h1 class="page-title"><?php the_title(); ?></h1>
            <?php if (has_excerpt()): ?>
                <p class="page-description"><?php the_excerpt(); ?></p>
            <?php endif; ?>
        </div>

        <div class="page-content">
            <?php
            // Renderizar componente test-showcase con datos completos
            if (function_exists('render_test_showcase')) {
                $test_images = [
                    ['src' => 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Asset+Test+1', 'alt' => 'Asset Manager Test 1'],
                    ['src' => 'https://via.placeholder.com/300x200/F7931E/FFFFFF?text=Asset+Test+2', 'alt' => 'Asset Manager Test 2'],
                    ['src' => 'https://via.placeholder.com/300x200/FFD23F/000000?text=Analytics+Test', 'alt' => 'Analytics Manager Test'],
                    ['src' => 'https://via.placeholder.com/300x200/06FFA5/000000?text=SEO+Test', 'alt' => 'SEO Manager Test']
                ];

                $test_data = [
                    'analytics' => ['page_view', 'component_view', 'interaction', 'form_submit'],
                    'seo' => ['schema' => 'WebPage', 'structured' => true],
                    'performance' => ['lazyLoading' => true, 'preload' => true]
                ];

                render_test_showcase(
                    'Test Showcase - Validación de Managers',
                    'Componente completo que ejercita todos los managers del sistema WordPress',
                    $test_images,
                    $test_data,
                    true
                );
            } else {
                echo '<p>⚠️ Componente test-showcase no disponible. Ejecutar regeneración.</p>';
            }
            ?>

            <!-- Sección adicional para testing de Template Manager -->
            <section class="template-validation">
                <h2>Template Manager Validation</h2>
                <div class="template-info">
                    <p><strong>Template actual:</strong> <?php echo basename(__FILE__); ?></p>
                    <p><strong>Post ID:</strong> <?php echo get_the_ID(); ?></p>
                    <p><strong>Post Type:</strong> <?php echo get_post_type(); ?></p>
                    <p><strong>Template Slug:</strong> <?php echo get_page_template_slug(); ?></p>
                    <p><strong>Body Classes:</strong> <?php echo implode(', ', get_body_class()); ?></p>
                </div>
            </section>

            <!-- Testing de WordPress content -->
            <section class="wordpress-content">
                <h2>WordPress Content Test</h2>
                <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                    <div class="post-content">
                        <?php the_content(); ?>
                    </div>
                <?php endwhile; endif; ?>
            </section>
        </div>
    </div>
</main>

<?php get_footer(); ?>