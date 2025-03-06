import { supabase } from "@/integrations/supabase/client";

export const fetchAllCategories = async (settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  let page = 1;
  let allCategories: any[] = [];
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(
        `${woocommerce_url}/wp-json/wc/v3/products/categories?per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const categories = await response.json();
      if (categories.length === 0) {
        hasMore = false;
      } else {
        allCategories = [...allCategories, ...categories];
        page++;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      hasMore = false;
    }
  }
  return allCategories;
};

export const fetchAllProducts = async (settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  let page = 1;
  let allProducts: any[] = [];
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products?per_page=100&page=${page}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const products = await response.json();
    if (products.length === 0) {
      hasMore = false;
    } else {
      allProducts = [...allProducts, ...products];
      page++;
    }
  }
  return allProducts;
};

export const updateProductPrice = async (productId: number, priceData: any, settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);

  const response = await fetch(
    `${woocommerce_url}/wp-json/wc/v3/products/${productId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(priceData),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update product ${productId}`);
  }

  return response.json();
};

export const updateProductImages = async (productId: number, images: any[], settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);

  const response = await fetch(
    `${woocommerce_url}/wp-json/wc/v3/products/${productId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update product images for product ${productId}`);
  }

  return response.json();
};

export const fetchProductSchema = async (settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);

  const response = await fetch(
    `${woocommerce_url}/wp-json/wc/v3/products/schema`,
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch product schema: ${response.statusText}`);
  }

  return response.json();
};

export interface ProceedProduct {
  id?: string;
  user_id?: string;
  import_file_id?: string;
  name: string;
  description?: string;
  short_description?: string;
  regular_price?: number;
  sale_price?: number;
  sku?: string;
  stock_quantity?: number;
  categories?: any[];
  tags?: any[];
  status?: string;
  type?: string;
  virtual?: boolean;
  downloadable?: boolean;
  images?: any[];
  created_at?: string;
  updated_at?: string;
}

export const createProceedProduct = async (userId: string, productData: Partial<ProceedProduct>, importFileId?: string) => {
  try {
    const { data, error } = await supabase
      .from('proceed_products')
      .insert({
        user_id: userId,
        import_file_id: importFileId,
        name: productData.name,
        description: productData.description,
        short_description: productData.short_description,
        regular_price: productData.regular_price,
        sale_price: productData.sale_price,
        sku: productData.sku,
        stock_quantity: productData.stock_quantity,
        categories: productData.categories || [],
        tags: productData.tags || [],
        status: productData.status || 'publish',
        type: productData.type,
        virtual: productData.virtual || false,
        downloadable: productData.downloadable || false,
        images: productData.images || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const batchCreateProceedProducts = async (userId: string, products: Partial<ProceedProduct>[], importFileId?: string) => {
  try {
    if (!products || products.length === 0) {
      return { count: 0 };
    }
    
    const productsToInsert = products.map(product => ({
      user_id: userId,
      import_file_id: importFileId,
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      categories: product.categories || [],
      tags: product.tags || [],
      status: product.status || 'publish',
      type: product.type,
      virtual: product.virtual || false,
      downloadable: product.downloadable || false,
      images: product.images || []
    }));
    
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      const { error, count } = await supabase
        .from('proceed_products')
        .insert(batch);
      
      if (error) throw error;
      insertedCount += count || 0;
    }
    
    return { count: insertedCount };
  } catch (error) {
    console.error('Error batch creating products:', error);
    throw error;
  }
};

export const fetchProceedProducts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('proceed_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchProceedProduct = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('proceed_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

export const updateProceedProduct = async (productId: string, productData: Partial<ProceedProduct>) => {
  try {
    const { data, error } = await supabase
      .from('proceed_products')
      .update({
        ...productData,
        user_id: undefined,
        created_at: undefined,
        updated_at: undefined,
        id: undefined
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
};

export const deleteProceedProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from('proceed_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

export const deleteAllProceedProducts = async (userId: string) => {
  try {
    console.log(`Attempting to delete all products for user ${userId}`);
    const { error } = await supabase
      .from('proceed_products')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error in deleteAllProceedProducts:', error);
      throw error;
    }
    
    console.log(`Successfully deleted all products for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting all products:', error);
    throw error;
  }
};

export const normalizeProductType = (type: string | undefined): string => {
  if (!type) return 'simple';

  const typeStr = String(type).toLowerCase().trim();
  const validTypes = ['simple', 'grouped', 'external', 'variable'];
  
  if (validTypes.includes(typeStr)) {
    return typeStr;
  }
  
  if (typeStr.includes('var') || typeStr.includes('option')) {
    return 'variable';
  } else if (typeStr.includes('ext') || typeStr.includes('aff')) {
    return 'external';
  } else if (typeStr.includes('group') || typeStr.includes('bundle')) {
    return 'grouped';
  }
  
  return 'simple';
};

export const createCategoryIfNotExists = async (categoryName: string, settings: any) => {
  if (!categoryName || categoryName.trim() === '') {
    console.log('Empty category name, skipping');
    return null;
  }

  const cleanCategoryName = categoryName.trim();
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  
  try {
    console.log(`Searching for category: "${cleanCategoryName}"`);
    
    const searchUrl = `${woocommerce_url}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(cleanCategoryName)}`;
    const response = await fetch(
      searchUrl,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to search categories: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to search categories: ${response.statusText}`);
    }

    const categories = await response.json();
    
    const exactMatch = categories.find((cat: any) => 
      cat.name.toLowerCase() === cleanCategoryName.toLowerCase()
    );
    
    if (exactMatch) {
      console.log(`Found existing category: ${cleanCategoryName} with ID ${exactMatch.id}`);
      return exactMatch.id;
    }
    
    console.log(`Creating new category: ${cleanCategoryName}`);
    const createResponse = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products/categories`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanCategoryName
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`Failed to create category: ${createResponse.status} ${createResponse.statusText}`, errorText);
      throw new Error(`Failed to create category: ${createResponse.statusText}`);
    }

    const newCategory = await createResponse.json();
    console.log(`Created new category: ${cleanCategoryName} with ID ${newCategory.id}`);
    return newCategory.id;
  } catch (error) {
    console.error(`Error in createCategoryIfNotExists for "${cleanCategoryName}":`, error);
    throw error;
  }
};

export const getProductBySku = async (sku: string, settings: any) => {
  if (!sku || sku.trim() === '') {
    return null;
  }
  
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  
  try {
    const response = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to check for product with SKU ${sku}: ${response.statusText}`);
    }
    
    const products = await response.json();
    if (products.length > 0) {
      return products[0];
    }
    
    const fuzzyResponse = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products?per_page=100`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );
    
    if (!fuzzyResponse.ok) {
      return null;
    }
    
    const allProducts = await fuzzyResponse.json();
    const matchingProduct = allProducts.find(p => 
      p.sku && p.sku.match(new RegExp(`^${sku}-[a-z0-9]{8}$`))
    );
    
    return matchingProduct || null;
  } catch (error) {
    console.error('Error checking for product by SKU:', error);
    return null;
  }
};

export const createProduct = async (data: any, settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);

  const productData = { ...data };

  if (!productData.stock_status) {
    const stockQuantity = parseInt(productData.stock_quantity, 10);
    productData.stock_status = !isNaN(stockQuantity) && stockQuantity > 0 ? 'instock' : 'outofstock';
  }

  if (productData.status) {
    const validStatuses = ['draft', 'pending', 'private', 'publish'];
    if (productData.status.toLowerCase() === 'instock') {
      productData.status = 'publish';
    } else if (productData.status.toLowerCase() === 'outofstock') {
      productData.status = 'draft';
    } else if (!validStatuses.includes(productData.status)) {
      productData.status = 'publish';
    }
  } else {
    productData.status = 'publish';
  }

  if (productData.stock_quantity !== undefined) {
    const quantity = parseInt(productData.stock_quantity, 10);
    productData.stock_quantity = isNaN(quantity) ? 0 : quantity;
    
    if (!productData.hasOwnProperty('manage_stock')) {
      productData.manage_stock = true;
    }
    
    if (!productData.hasOwnProperty('backorders')) {
      productData.backorders = 'no';
    }
  }

  productData.type = normalizeProductType(productData.type);
  
  console.log('Creating product with data:', productData);

  try {
    const response = await fetch(`${woocommerce_url}/wp-json/wc/v3/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WooCommerce API error:', errorData);
      throw new Error(errorData.message || 'Failed to create product');
    }

    return response.json();
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
};

export const updateProduct = async (productId: number, data: any, settings: any) => {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  
  const productData = { ...data };
  
  if (productData.stock_quantity !== undefined && !productData.stock_status) {
    const stockQuantity = parseInt(productData.stock_quantity, 10);
    productData.stock_status = !isNaN(stockQuantity) && stockQuantity > 0 ? 'instock' : 'outofstock';
  }
  
  if (productData.status) {
    const validStatuses = ['draft', 'pending', 'private', 'publish'];
    if (productData.status.toLowerCase() === 'instock') {
      productData.status = 'publish';
    } else if (productData.status.toLowerCase() === 'outofstock') {
      productData.status = 'draft';
    } else if (!validStatuses.includes(productData.status)) {
      productData.status = 'publish';
    }
  }
  
  if (productData.stock_quantity !== undefined) {
    const quantity = parseInt(productData.stock_quantity, 10);
    productData.stock_quantity = isNaN(quantity) ? 0 : quantity;
    
    if (!productData.hasOwnProperty('manage_stock')) {
      productData.manage_stock = true;
    }
    
    if (!productData.hasOwnProperty('backorders')) {
      productData.backorders = 'no';
    }
  }
  
  if (productData.type) {
    productData.type = normalizeProductType(productData.type);
  }

  console.log('Updating product with data:', productData);

  try {
    const response = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products/${productId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WooCommerce API error:', errorData);
      throw new Error(errorData.message || `Failed to update product ${productId}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
};

export const updateProductsFileId = async (userId: string, importFileId: string) => {
  try {
    const { data, error } = await supabase
      .from('proceed_products')
      .update({ import_file_id: importFileId })
      .eq('user_id', userId)
      .is('import_file_id', null)
      .select();

    if (error) throw error;
    return { updated: data?.length || 0 };
  } catch (error) {
    console.error('Error updating products import file ID:', error);
    throw error;
  }
};
