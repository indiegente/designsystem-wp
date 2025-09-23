const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * HTML Source
 *
 * Obtiene contenido HTML desde URLs en vivo.
 * Maneja timeouts, redirects y errores de conexión.
 */
class HTMLSource {
  constructor(config = {}) {
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 2;
    this.userAgent = config.userAgent || 'WordPress-Validator/1.0';
  }

  /**
   * Prepara la fuente con el contexto dado
   * @param {Object} context - Contexto con URLs a validar
   * @returns {Object} HTML content por URL
   */
  async prepare(context) {
    const { urls = [] } = context;
    const htmlContent = {};

    for (const urlConfig of urls) {
      const { url, name } = urlConfig;
      console.log(`   🌐 Obteniendo HTML de ${name} (${url})...`);

      try {
        const response = await this.fetchUrl(url);
        htmlContent[name] = {
          html: response.html,
          statusCode: response.statusCode,
          headers: response.headers,
          url: url,
          metadata: {
            responseTime: response.responseTime,
            contentLength: response.html.length,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.log(`   ❌ Error obteniendo ${name}: ${error.message}`);
        htmlContent[name] = {
          html: '',
          statusCode: 0,
          error: error.message,
          url: url,
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }
    }

    return htmlContent;
  }

  /**
   * Obtiene contenido HTML de una URL con reintentos
   * @param {string} url - URL a obtener
   * @returns {Promise<Object>} Respuesta con HTML y metadata
   */
  async fetchUrl(url) {
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.fetchUrlOnce(url);
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          console.log(`   ⚠️ Intento ${attempt} falló, reintentando...`);
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Obtiene contenido HTML de una URL (un intento)
   * @param {string} url - URL a obtener
   * @returns {Promise<Object>} Respuesta con HTML y metadata
   */
  async fetchUrlOnce(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        },
        timeout: this.timeout
      };

      const req = client.request(options, (res) => {
        let data = '';
        const chunks = [];

        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          console.log(`   ↗️ Redirect: ${redirectUrl}`);
          return this.fetchUrlOnce(redirectUrl).then(resolve).catch(reject);
        }

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            // Handle gzip compression
            if (res.headers['content-encoding'] === 'gzip') {
              const zlib = require('zlib');
              data = zlib.gunzipSync(Buffer.concat(chunks)).toString();
            } else {
              data = Buffer.concat(chunks).toString();
            }

            const responseTime = Date.now() - startTime;

            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              html: data,
              responseTime: responseTime
            });
          } catch (error) {
            reject(new Error(`Error procesando respuesta: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout después de ${this.timeout}ms`));
      });

      req.setTimeout(this.timeout);
      req.end();
    });
  }

  /**
   * Genera URLs de test desde configuración
   * @param {Object} config - Configuración del proyecto
   * @returns {Array} Array de configuraciones de URL
   */
  static generateTestUrls(config = {}) {
    const { baseUrl = 'http://localhost', pageTemplates = {} } = config;
    const urls = [];

    // URLs desde page-templates.json
    Object.keys(pageTemplates).forEach(pageName => {
      const pageConfig = pageTemplates[pageName];
      // Convertir page-carreras → carreras, page-contacto → contacto, etc.
      const urlPath = pageName.replace('page-', '');

      urls.push({
        name: pageName,
        url: `${baseUrl}/${urlPath}/`,
        type: 'page',
        expectedComponents: HTMLSource.getExpectedComponents(pageName, pageConfig)
      });
    });

    // URLs adicionales comunes
    urls.push({
      name: 'homepage',
      url: baseUrl,
      type: 'front-page',
      expectedComponents: []
    });

    return urls;
  }

  /**
   * Obtiene componentes esperados para una página
   * @param {string} pageName - Nombre de la página
   * @param {Object} pageConfig - Configuración de la página
   * @returns {Array} Array de nombres de componentes
   */
  static getExpectedComponents(pageName, pageConfig) {
    const components = [];

    if (pageConfig && pageConfig.components) {
      pageConfig.components.forEach(component => {
        components.push(component.name);
      });
    }

    return components;
  }

  /**
   * Valida si una URL es accesible
   * @param {string} url - URL a validar
   * @returns {Promise<boolean>} True si es accesible
   */
  async isUrlAccessible(url) {
    try {
      const response = await this.fetchUrlOnce(url);
      return response.statusCode >= 200 && response.statusCode < 400;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene metadata de una URL sin descargar todo el contenido
   * @param {string} url - URL a verificar
   * @returns {Promise<Object>} Metadata de la respuesta
   */
  async getUrlMetadata(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      }, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length'],
          lastModified: res.headers['last-modified']
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.setTimeout(5000);
      req.end();
    });
  }

  /**
   * Delay utility
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Método estático para crear fuente con configuración rápida
   * @param {Object} config - Configuración
   * @returns {HTMLSource} Instancia configurada
   */
  static create(config = {}) {
    return new HTMLSource(config);
  }
}

module.exports = HTMLSource;