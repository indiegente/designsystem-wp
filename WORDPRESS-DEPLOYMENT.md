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
    ├── functions.php           # ✅ Obligatorio
    ├── 404.php                 # ✅ Recomendado
    ├── search.php              # ✅ Recomendado
    ├── front-page.php          # ✅ Página principal
    ├── assets/
    │   ├── css/
    │   └── js/
    └── components/
        └── hero-section/
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
# Generar y validar automáticamente
npm run wp:generate

# O validar manualmente después
npm run wp:validate
```

### 3. Ver Cambios en WordPress
Los cambios se reflejan automáticamente gracias al symlink:
- ✅ Templates PHP actualizados
- ✅ CSS/JS regenerado
- ✅ Componentes convertidos

## ✅ Validación de Compatibilidad

El validador verifica que el tema sea compatible con WordPress:

```bash
🔍 Validando generación...
📊 Reporte de Validación:
✅ Templates obligatorios: ✓ header.php ✓ footer.php ✓ index.php
✅ Hooks WordPress: ✓ wp_head() ✓ wp_footer()
✅ Estructura de tema válida
🏁 Estado final: ✅ VÁLIDO PARA WORDPRESS
```

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