const fs = require('fs');
const path = require('path');

class ComponentGenerator {
  constructor(config) {
    this.config = config;
    this.metadata = this.loadComponentMetadata();
  }

  loadComponentMetadata() {
    const metadataPath = path.join(this.config.srcDir, 'component-metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.warn('⚠️ No se encontró component-metadata.json');
      return {};
    }
    
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error cargando component-metadata.json:', error.message);
      return {};
    }
  }

  generateComponentCode(component, dataSource) {
    const componentName = component.name;
    const metadata = this.metadata[componentName];
    
    if (!metadata) {
      console.warn(`⚠️ No se encontró metadata para el componente: ${componentName}`);
      return this.generateFallbackCode(component, dataSource);
    }

    switch (metadata.type) {
      case 'static':
        return this.generateStaticComponent(component, metadata);
      case 'iterative':
        return this.generateIterativeComponent(component, metadata, dataSource);
      case 'aggregated':
        return this.generateAggregatedComponent(component, metadata, dataSource);
      default:
        return this.generateFallbackCode(component, dataSource);
    }
  }

  generateStaticComponent(component, metadata) {
    const props = component.props || {};
    const paramValues = metadata.parameters.map(param => {
      return props[param.name] || param.default;
    });
    
    const paramsString = paramValues.map(value => `'${value}'`).join(', ');
    
    return `${metadata.phpFunction}(${paramsString});`;
  }

  generateIterativeComponent(component, metadata, dataSource) {
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name);
    
    const paramMappings = metadata.parameters.map(param => {
      if (param.name === 'title') return 'get_the_title()';
      if (param.name === 'description') return 'get_the_excerpt()';
      if (param.name === 'image') return 'get_the_post_thumbnail_url(get_the_ID(), \'medium\')';
      if (param.name === 'link') return 'get_permalink()';
      if (param.name === 'link_text') return `'${param.default}'`;
      return `'${param.default}'`;
    });
    
    const paramsString = paramMappings.join(',\n          ');
    
    return `
    $items = get_posts(array(${queryString}));
    
    if (!empty($items)) {
      foreach ($items as $item) {
        setup_postdata($item);
        ${metadata.phpFunction}(${paramsString});
      }
      wp_reset_postdata();
    }`;
  }

  generateAggregatedComponent(component, metadata, dataSource) {
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name);
    const aggregation = metadata.aggregation;
    
    const dataStructure = aggregation.dataStructure;
    const defaultValues = aggregation.defaultValues || {};
    
    const dataMapping = Object.entries(dataStructure).map(([key, value]) => {
      let mapping = '';
      if (value === 'post_title') mapping = 'get_the_title()';
      else if (value === 'post_excerpt') mapping = 'get_the_excerpt()';
      else if (value === 'post_content') mapping = 'get_the_content()';
      else if (value.startsWith('meta_')) {
        const metaKey = value.replace('meta_', '');
        const defaultValue = defaultValues[key] || '';
        mapping = `get_post_meta(get_the_ID(), '${metaKey}', true) ?: '${defaultValue}'`;
      }
      else mapping = `'${value}'`;
      
      return `'${key}' => ${mapping}`;
    }).join(',\n          ');
    
    const props = component.props || {};
    const staticParams = metadata.parameters
      .filter(param => param.type !== 'array')
      .map(param => `'${props[param.name] || param.default}'`)
      .join(', ');
    
    return `
    $items = get_posts(array(${queryString}));
    $${component.name}_data = array();
    
    if (!empty($items)) {
      foreach ($items as $item) {
        setup_postdata($item);
        $${component.name}_data[] = array(
          ${dataMapping}
        );
      }
      wp_reset_postdata();
    }
    
    ${metadata.phpFunction}(${staticParams}, $${component.name}_data);`;
  }

  generateFallbackCode(component, dataSource) {
    const componentName = component.name.replace('-', '_');
    const query = dataSource?.query || {};
    const queryString = this.buildQueryString(query, component.name);
    
    return `
    // Código fallback para ${componentName}
    $items = get_posts(array(${queryString}));
    
    if (!empty($items)) {
      foreach ($items as $item) {
        setup_postdata($item);
        // render_${componentName}() - implementar según necesidad
      }
      wp_reset_postdata();
    }`;
  }

  buildQueryString(query, componentName) {
    // Asegurar post_type basado en el componente
    if (!query.post_type) {
      if (componentName === 'course-card') {
        query.post_type = 'carrera';
      } else if (componentName === 'testimonials') {
        query.post_type = 'testimonio';
      }
    }
    
    return Object.entries(query)
      .map(([key, value]) => `'${key}' => ${typeof value === 'string' ? `'${value}'` : value}`)
      .join(', ');
  }

  generatePhpParameters(componentName) {
    const metadata = this.metadata[componentName];
    if (!metadata) return '';
    
    return metadata.parameters
      .map(param => `$${param.name} = '${param.default}'`)
      .join(', ');
  }

  getComponentTemplate(componentName) {
    const metadata = this.metadata[componentName];
    return metadata?.template || componentName;
  }
}

module.exports = ComponentGenerator;
