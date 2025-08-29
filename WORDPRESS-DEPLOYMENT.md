# WordPress Deployment - Symlink Setup

Este documento explica cómo configurar un symlink desde tu Docker WordPress hacia el tema generado.

## 📁 Estructura Generada

Después de ejecutar `npm run wp:generate`, tendrás:

```
wordpress-output/
└── toulouse-lautrec/           # ← Tema WordPress completo
    ├── header.php              # ✅ Obligatorio
    ├── footer.php              # ✅ Obligatorio  
    ├── index.php               # ✅ Obligatorio
    ├── style.css               # ✅ Obligatorio
    ├── functions.php           # ✅ Obligatorio (con config dinámica)
    ├── 404.php                 # ✅ Recomendado
    ├── search.php              # ✅ Recomendado
    ├── front-page.php          # ✅ Página principal
    ├── page-carreras.php       # ✅ Template específico con SEO
    ├── assets/
    │   ├── css/
    │   │   ├── design-tokens.css
    │   │   └── toulouse-design-system-[hash].css
    │   ├── js/
    │   │   ├── toulouse-ds.es.js      # ES6 preferido
    │   │   └── toulouse-ds.umd.js     # UMD fallback
    │   ├── seo-config.json            # 🆕 SEO por template
    │   ├── asset-manifest.json        # 🆕 Manifest de assets
    │   └── validation-rules.json      # 🆕 Reglas de validación
    ├── inc/
    │   ├── seo-manager.php            # 🆕 SEO dinámico
    │   └── asset-enqueue.php          # 🆕 Carga optimizada
    └── components/
        ├── hero-section/
        │   └── hero-section.php
        ├── course-card/
        │   └── course-card.php
        └── testimonials/
            └── testimonials.php       # 🆕 Conversión Lit → PHP
```

## 🐳 Configuración Docker WordPress

### Opción 1: Symlink en Docker Compose

```yaml
version: '3.8'
services:
  wordpress:
    image: wordpress:latest
    volumes:
      # Otros volúmenes...
      - ./wordpress-output/toulouse-lautrec:/var/www/html/wp-content/themes/toulouse-lautrec:ro
```

### Opción 2: Symlink Manual en Contenedor

1. **Accede al contenedor:**
```bash
docker exec -it wordpress_container_name bash
```

2. **Crear symlink:**
```bash
ln -sf /host/path/to/wordpress-output/toulouse-lautrec /var/www/html/wp-content/themes/toulouse-lautrec
```

### Opción 3: Bind Mount en Docker Run

```bash
docker run -d \
  --name mi-wordpress \
  -v $(pwd)/wordpress-output/toulouse-lautrec:/var/www/html/wp-content/themes/toulouse-lautrec:ro \
  wordpress:latest
```

## 🔄 Workflow de Desarrollo

### 1. Desarrollar Componentes
```bash
# Desarrollar en Lit + Storybook
npm run dev
npm run storybook
```

### 2. Generar Tema WordPress
```bash
# Generar con validación automática integrada
npm run wp:generate

# Validación específica de PHP (opcional)
npm run wp:validate-php

# Validación general del tema (opcional)
npm run wp:validate
```

**🆕 Características Avanzadas:**
- ✅ **Sintaxis PHP verificada** con `php -l` en tiempo real
- ✅ **Patrones problemáticos detectados** y corregidos automáticamente
- ✅ **Variables globales validadas** contra null pointers  
- ✅ **CSS de Web Components limpiado** para WordPress
- ✅ **Rollback automático** si hay errores
- ✅ **Conversión Lit → PHP** con métodos y condicionales
- ✅ **SEO dinámico** con meta tags específicos por template
- ✅ **Configuración client-agnostic** usando ConfigManager
- ✅ **Asset management** con ES6/UMD y hashes únicos

### 3. Ver Cambios en WordPress
Los cambios se reflejan automáticamente gracias al symlink:
- ✅ **Templates PHP actualizados** con conversión Lit → PHP
- ✅ **CSS/JS regenerado** con hashes únicos y optimización
- ✅ **Componentes convertidos** con métodos y condicionales  
- ✅ **SEO dinámico aplicado** por template específico
- ✅ **Meta tags y JSON-LD** generados automáticamente

## ✅ Validación de Compatibilidad

### Validación Completa del Tema

El validador verifica que el tema sea compatible con WordPress:

```bash
🔍 Validando generación...
📊 Reporte de Validación:
✅ Templates obligatorios: ✓ header.php ✓ footer.php ✓ index.php
✅ Hooks WordPress: ✓ wp_head() ✓ wp_footer()
✅ Estructura de tema válida
🏁 Estado final: ✅ VÁLIDO PARA WORDPRESS
```

### Validación de Sintaxis PHP

Adicionalmente, se valida la sintaxis PHP de todos los archivos:

```bash
🔍 Iniciando validación completa de sintaxis PHP...
🐘 PHP detectado: PHP 8.4.4 (cli)
📋 Validando archivos principales...
📄 Validando templates de página...
🧩 Validando componentes...

📊 Reporte de Validación PHP
══════════════════════════════════════════════════
📁 Archivos totales: 19
✅ Archivos válidos: 19
❌ Errores encontrados: 0
📈 Tasa de éxito: 100.0%

🎉 ¡Todos los archivos PHP tienen sintaxis correcta!
```

### Manejo de Errores

Si se detectan errores, el sistema:
1. **Detiene la generación** inmediatamente
2. **Muestra errores detallados** con líneas específicas
3. **Limpia archivos parciales** automáticamente
4. **Sugiere soluciones** para cada tipo de error

## 🚀 Activar Tema en WordPress

1. Accede al admin de WordPress
2. Ve a **Apariencia > Temas**  
3. Activa **Toulouse Lautrec**

## 🔧 Troubleshooting

### Permisos en Symlink
```bash
# Si hay problemas de permisos
sudo chown -R www-data:www-data /path/to/wordpress-output/
```

### Validar Symlink
```bash
# Verificar que el symlink funciona
ls -la /var/www/html/wp-content/themes/
```

### Logs de WordPress
```bash
# Ver logs del contenedor
docker logs wordpress_container_name
```

## 📝 Archivos Críticos para WordPress

- `style.css` → Header del tema (obligatorio)
- `functions.php` → Configuración y hooks
- `header.php` → Incluye wp_head()
- `footer.php` → Incluye wp_footer()
- `index.php` → Template principal

¡Con esta configuración, cualquier cambio en tu Design System se refleja automáticamente en WordPress! 🎉