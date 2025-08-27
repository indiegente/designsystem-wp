class WpTemplates {
  generate(templateName) {
    const templates = {
      'header': `<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
    <div class="container">
        <h1 class="site-title">
            <a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>
        </h1>
        
        <nav class="main-navigation">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'container' => false,
                'menu_class' => 'nav-menu'
            ));
            ?>
        </nav>
    </div>
</header>`,

      'footer': `<footer class="site-footer">
    <div class="container">
        <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. Todos los derechos reservados.</p>
        
        <nav class="footer-navigation">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'footer',
                'container' => false,
                'menu_class' => 'footer-menu'
            ));
            ?>
        </nav>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>`,

      '404': `<?php
get_header();
?>

<main class="error-404-content">
    <div class="container">
        <h1>404 - Página no encontrada</h1>
        <p>Lo sentimos, la página que buscas no existe.</p>
        
        <div class="search-form">
            <?php get_search_form(); ?>
        </div>
        
        <a href="<?php echo esc_url(home_url('/')); ?>" class="btn-home">
            Volver al inicio
        </a>
    </div>
</main>

<?php get_footer(); ?>`,

      'search': `<?php
get_header();
?>

<main class="search-results">
    <div class="container">
        <h1>Resultados de búsqueda para: "<?php the_search_query(); ?>"</h1>
        
        <?php if (have_posts()) : ?>
            <div class="search-results-list">
                <?php while (have_posts()) : the_post(); ?>
                    <article class="search-result-item">
                        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                        <div class="excerpt"><?php the_excerpt(); ?></div>
                    </article>
                <?php endwhile; ?>
            </div>
            
            <?php the_posts_pagination(); ?>
        <?php else : ?>
            <p>No se encontraron resultados para tu búsqueda.</p>
            <?php get_search_form(); ?>
        <?php endif; ?>
    </div>
</main>

<?php get_footer(); ?>`,

      'front-page': `<?php
get_header();

// Incluir componentes
require_once get_template_directory() . '/components/hero-section/hero-section.php';
require_once get_template_directory() . '/components/course-card/course-card.php';

// Hero principal
render_hero_section(
    get_field('hero_title') ?: 'Descubre tu potencial creativo',
    get_field('hero_subtitle') ?: 'Carreras técnicas y programas especializados',
    get_field('hero_image') ?: '',
    get_field('hero_cta_text') ?: 'Explorar carreras',
    get_field('hero_cta_url') ?: '/carreras'
);
?>

<main class="home-content">
    <!-- Contenido adicional del home -->
</main>

<?php get_footer(); ?>`,

      'page-carreras': `<?php
/*
Template Name: Carreras
*/
get_header();

require_once get_template_directory() . '/components/course-card/course-card.php';

$carreras = get_posts(array(
    'post_type' => 'carrera',
    'numberposts' => -1,
    'post_status' => 'publish'
));
?>

<div class="carreras-container">
    <h1><?php the_title(); ?></h1>
    
    <div class="carreras-grid">
        <?php foreach ($carreras as $carrera): ?>
            <?php
            render_course_card(
                get_the_title($carrera),
                get_the_excerpt($carrera),
                get_the_post_thumbnail_url($carrera, 'medium'),
                get_permalink($carrera),
                'Ver carrera'
            );
            ?>
        <?php endforeach; ?>
    </div>
</div>

<?php get_footer(); ?>`
    };

    return templates[templateName] || `<?php
/* Template: ${templateName} */
get_header();
?>

<main class="${templateName}-content">
    <h1><?php the_title(); ?></h1>
    <?php the_content(); ?>
</main>

<?php get_footer(); ?>`;
  }
}

module.exports = WpTemplates;