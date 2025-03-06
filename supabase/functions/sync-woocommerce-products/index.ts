
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Server configuration error')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    if (userError || !user) {
      console.error('Invalid user token:', userError)
      throw new Error('Invalid user token')
    }

    console.log('User authenticated:', user.id)

    // Get WooCommerce settings for the user
    const { data: settings, error: settingsError } = await supabaseClient
      .from('woocommerce_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError) {
      console.error('Settings error:', settingsError)
      throw new Error('Failed to fetch WooCommerce settings')
    }

    if (!settings) {
      console.error('Store credentials not found for user:', user.id)
      return new Response(
        JSON.stringify({
          error: 'Store credentials not found',
          message: 'Please configure your WooCommerce store credentials in the Settings page before syncing products.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { woocommerce_url, consumer_key, consumer_secret } = settings
    const auth = btoa(`${consumer_key}:${consumer_secret}`)

    console.log('Connecting to WooCommerce store:', woocommerce_url)

    // Test the WooCommerce connection
    const testResponse = await fetch(`${woocommerce_url}/wp-json/wc/v3/products?per_page=1`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!testResponse.ok) {
      console.error('WooCommerce API test failed:', testResponse.status, testResponse.statusText)
      return new Response(
        JSON.stringify({
          error: 'Invalid store credentials',
          message: 'Unable to connect to your WooCommerce store. Please check your credentials in the Settings page.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('WooCommerce API test successful')

    // Fetch categories from WooCommerce
    const categoriesResponse = await fetch(`${woocommerce_url}/wp-json/wc/v3/products/categories?per_page=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!categoriesResponse.ok) {
      console.error('Failed to fetch categories:', categoriesResponse.status, categoriesResponse.statusText)
      throw new Error(`WooCommerce API error: ${categoriesResponse.statusText}`)
    }

    const categories = await categoriesResponse.json()
    console.log(`Fetched ${categories.length} categories from WooCommerce`)

    // Fetch products from WooCommerce
    const productsResponse = await fetch(`${woocommerce_url}/wp-json/wc/v3/products?per_page=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!productsResponse.ok) {
      console.error('Failed to fetch products:', productsResponse.status, productsResponse.statusText)
      throw new Error(`WooCommerce API error: ${productsResponse.statusText}`)
    }

    const products = await productsResponse.json()
    console.log(`Fetched ${products.length} products from WooCommerce`)

    return new Response(
      JSON.stringify({ 
        message: `Successfully fetched ${products.length} products and ${categories.length} categories`,
        products,
        categories 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in sync-woocommerce-products function:', error.message)
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
