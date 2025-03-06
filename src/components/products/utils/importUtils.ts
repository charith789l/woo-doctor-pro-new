
import { PreviewProduct } from '../types/import-types';

export const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  result.push(currentValue.trim());
  return result.map(value => value.replace(/^"|"$/g, '').trim());
};

export const truncateText = (text: string) => {
  if (!text) return '-';
  const words = text.split(' ');
  if (words.length > 2) {
    return `${words.slice(0, 2).join(' ')}...`;
  }
  return text;
};

export const detectFields = (fileContent: string, fileType: 'csv' | 'xml'): string[] => {
  if (fileType === 'csv') {
    const lines = fileContent.split('\n');
    if (lines.length > 0) {
      return parseCsvLine(lines[0]);
    }
  } else if (fileType === 'xml') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, "text/xml");
    const productNode = xmlDoc.querySelector('product') || xmlDoc.documentElement.children[0];
    if (productNode) {
      return Array.from(productNode.children).map(node => node.tagName);
    }
  }
  return [];
};

export const normalizeProductType = (type: string | undefined): string => {
  if (!type) return 'simple';

  const typeStr = String(type).toLowerCase();
  const validTypes = ['simple', 'grouped', 'external', 'variable'];
  
  if (validTypes.includes(typeStr)) {
    return typeStr;
  }
  
  // Map common variations to valid WooCommerce types
  if (typeStr.includes('var') || typeStr.includes('option')) {
    return 'variable';
  } else if (typeStr.includes('ext') || typeStr.includes('aff')) {
    return 'external';
  } else if (typeStr.includes('group') || typeStr.includes('bundle')) {
    return 'grouped';
  }
  
  // Default to simple for anything else
  return 'simple';
};

// New utility functions for XML data processing
export const processXmlCategories = (categoryString: string): string[] => {
  if (!categoryString) return [];
  
  return categoryString
    .split('\n')
    .map(cat => cat.trim())
    .filter(cat => cat.length > 0);
};

export const processXmlImages = (imageString: string): string[] => {
  if (!imageString) return [];
  
  const baseUrl = "https://images.williams-trading.com/product_images";
  
  return imageString
    .split('\n')
    .map(img => img.trim())
    .filter(img => img.length > 0)
    .map(img => {
      if (img.startsWith('http')) return img;
      // Clean up the path - remove any leading slashes to prevent double slashes
      const cleanPath = img.startsWith('/') ? img.substring(1) : img;
      return `${baseUrl}/${cleanPath}`;
    });
};

// Normalize product status to consistently use "publish" instead of "draft"
export const normalizeProductStatus = (status: string | undefined): string => {
  if (!status) return 'publish';
  
  const statusStr = String(status).toLowerCase().trim();
  
  // Map stock status to publish status
  if (statusStr === 'instock') {
    return 'publish';
  }
  
  // Map WooCommerce status values
  if (['publish', 'draft', 'pending', 'private'].includes(statusStr)) {
    // Override "draft" to be "publish" by default
    return statusStr === 'draft' ? 'publish' : statusStr;
  }
  
  // Default to publish for anything else
  return 'publish';
};

export const generatePreview = (
  fileType: 'csv' | 'xml',
  fileContent: string,
  mappings: { [key: string]: string }
): { products: PreviewProduct[], totalProducts: number } => {
  let products: PreviewProduct[] = [];
  let totalProducts = 0;
  
  if (fileType === 'csv') {
    const lines = fileContent.split('\n').filter(line => line.trim());
    const headers = parseCsvLine(lines[0]);
    
    products = lines.slice(1, 11).map(line => {
      const values = parseCsvLine(line);
      const product: PreviewProduct = {};
      
      Object.entries(mappings).forEach(([fileField, wooField]) => {
        const fieldIndex = headers.findIndex(header => header === fileField);
        if (fieldIndex !== -1 && fieldIndex < values.length) {
          let value = values[fieldIndex];
          if (wooField === 'images' && value) {
            try {
              const parsed = JSON.parse(value);
              value = Array.isArray(parsed) ? parsed.join(', ') : value;
            } catch {
              value = value;
            }
          } else if ((wooField === 'categories' || wooField === 'tags') && value) {
            try {
              const parsed = JSON.parse(value);
              value = Array.isArray(parsed) ? parsed.join(', ') : value;
            } catch {
              value = value.split(',').map(v => v.trim()).join(', ');
            }
          } else if (wooField === 'type' && value) {
            // Normalize the product type to WooCommerce valid types
            value = normalizeProductType(value);
          } else if (wooField === 'status' && value) {
            // Normalize the product status to use "publish" instead of "draft"
            value = normalizeProductStatus(value);
          }
          product[wooField] = value;
        }
      });
      
      // Ensure status is always set to "publish" if not explicitly mapped
      if (!product['status']) {
        product['status'] = 'publish';
      }
      
      return product;
    });
    
    totalProducts = lines.length - 1;
  } else if (fileType === 'xml') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, "text/xml");
    const productNodes = xmlDoc.getElementsByTagName('product');
    const allProducts = Array.from(productNodes);
    
    products = allProducts.slice(0, 10).map(productNode => {
      const product: PreviewProduct = {};
      Object.entries(mappings).forEach(([fileField, wooField]) => {
        const element = productNode.getElementsByTagName(fileField)[0];
        if (element) {
          let value = element.textContent || '';
          
          if (wooField === 'type' && value) {
            // Normalize the product type to WooCommerce valid types
            value = normalizeProductType(value);
          } else if (wooField === 'status' && value) {
            // Normalize the product status to use "publish" instead of "draft"
            value = normalizeProductStatus(value);
          } else if (wooField === 'categories' && value) {
            // Process XML categories specially
            const categoryArray = processXmlCategories(value);
            value = categoryArray.join(', ');
          } else if (wooField === 'images' && value) {
            // Process XML images specially
            const imageArray = processXmlImages(value);
            value = imageArray.join(', ');
          }
          
          product[wooField] = value;
        }
      });
      
      // Ensure product type is always set to a valid value
      if (!product['type']) {
        product['type'] = 'simple';
      }
      
      // Ensure status is always set to "publish" if not explicitly mapped
      if (!product['status']) {
        product['status'] = 'publish';
      }
      
      return product;
    });
    totalProducts = allProducts.length;
  }
  
  return { products, totalProducts };
};
