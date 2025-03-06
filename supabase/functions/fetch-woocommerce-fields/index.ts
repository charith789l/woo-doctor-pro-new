
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface WooCommerceSettings {
  woocommerce_url: string;
  consumer_key: string;
  consumer_secret: string;
}

// Function to fetch schema from WooCommerce API
async function fetchWooCommerceSchema(settings: WooCommerceSettings) {
  const { woocommerce_url, consumer_key, consumer_secret } = settings;
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  
  console.log(`Fetching schema from ${woocommerce_url}/wp-json/wc/v3/products/schema`);
  
  try {
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
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching WooCommerce schema:', error);
    throw error;
  }
}

// Extract all field names from the WooCommerce schema
function extractFieldsFromSchema(schema: any): string[] {
  // Start with top-level properties
  const fieldNames = Object.keys(schema.properties || {});
  
  // Process nested properties recursively
  const processNestedFields = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    let fields: string[] = [];
    
    // Handle arrays of objects (like variations, attributes, etc.)
    if (Array.isArray(obj.items) && obj.items.length > 0) {
      obj.items.forEach((item: any, index: number) => {
        fields = [...fields, ...processNestedFields(item, `${prefix}[${index}]`)];
      });
    } 
    // Handle object with items property (common in WooCommerce schema)
    else if (obj.items && obj.items.properties) {
      fields = [...fields, ...processNestedFields(obj.items.properties, prefix ? `${prefix}_item` : 'item')];
    }
    // Handle regular object properties
    else if (obj.properties) {
      Object.keys(obj.properties).forEach(key => {
        const fullKey = prefix ? `${prefix}_${key}` : key;
        fields.push(fullKey);
        fields = [...fields, ...processNestedFields(obj.properties[key], fullKey)];
      });
    }
    
    return fields;
  };

  // Add nested fields
  Object.keys(schema.properties || {}).forEach(key => {
    fieldNames.push(...processNestedFields(schema.properties[key], key));
  });

  // Deduplicate and filter out excessively nested fields
  return [...new Set(fieldNames)]
    .filter(field => 
      // Limit excessive nesting and very long field names
      field.split('_').length <= 4 && 
      field.length <= 50);
}

// Default WooCommerce fields as fallback
const defaultFields = [
  'name',
  'description',
  'short_description',
  'regular_price',
  'sale_price',
  'sku',
  'stock_quantity',
  'categories',
  'tags',
  'status',
  'type',
  'virtual',
  'downloadable',
  'images',
  'weight',
  'dimensions',
  'attributes',
  'variations',
  'related_ids',
  'upsell_ids',
  'cross_sell_ids',
  'parent_id',
  'reviews_allowed',
  'purchase_note',
  'menu_order',
  'slug'
]

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { storeId, userId } = await req.json()

    if (!storeId) {
      console.error('Missing storeId in request')
      throw new Error('Store ID is required')
    }

    if (!userId) {
      console.error('Missing userId in request')
      throw new Error('User ID is required')
    }

    console.log(`Fetching WooCommerce fields for user: ${userId}, store: ${storeId}`)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Server configuration error')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Fetch the store settings
    const { data: storeSettings, error: settingsError } = await supabaseClient
      .from('woocommerce_settings')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching store settings:', settingsError)
      throw settingsError
    }

    if (!storeSettings) {
      console.error('Store settings not found')
      throw new Error('Store settings not found')
    }

    // First check if we already have fields for this user
    const { data: existingFields, error: checkError } = await supabaseClient
      .from('woocommerce_product_fields')
      .select('field_name')
      .eq('user_id', userId)

    if (checkError) {
      console.error('Error checking existing fields:', checkError)
      throw checkError
    }

    let fieldsToUse: string[] = [];

    // Try to fetch fields from WooCommerce API if user has no fields yet
    if (!existingFields || existingFields.length === 0) {
      console.log(`No existing fields found for user ${userId}, fetching from WooCommerce API`)
      
      try {
        // Fetch schema from WooCommerce API
        const schema = await fetchWooCommerceSchema(storeSettings);
        
        // Extract fields from schema
        fieldsToUse = extractFieldsFromSchema(schema);
        
        console.log(`Extracted ${fieldsToUse.length} fields from WooCommerce schema`);
        
        // If we couldn't extract any fields, use the default ones
        if (fieldsToUse.length === 0) {
          console.log('No fields extracted from schema, using defaults');
          fieldsToUse = defaultFields;
        }
      } catch (schemaError) {
        console.error('Error fetching or parsing WooCommerce schema:', schemaError);
        console.log('Using default fields due to error');
        fieldsToUse = defaultFields;
      }
      
      // Insert the fields into the database
      const { error: insertError } = await supabaseClient
        .from('woocommerce_product_fields')
        .insert(
          fieldsToUse.map(fieldName => ({
            field_name: fieldName,
            user_id: userId,
          }))
        )

      if (insertError) {
        console.error('Error inserting fields:', insertError)
        throw insertError
      }
      
      console.log(`Inserted ${fieldsToUse.length} fields for user ${userId}`);
    } else {
      console.log(`Found ${existingFields.length} existing fields for user ${userId}`)
      fieldsToUse = existingFields.map(f => f.field_name);
    }

    // Fetch all fields
    const { data: fields, error: fetchError } = await supabaseClient
      .from('woocommerce_product_fields')
      .select('field_name')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching fields:', fetchError)
      throw fetchError
    }

    console.log('Successfully fetched fields for user:', userId)

    // Return the response
    return new Response(
      JSON.stringify({
        fields: fields?.map(f => f.field_name) || fieldsToUse,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fetch-woocommerce-fields function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})
