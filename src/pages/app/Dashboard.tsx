import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, DollarSign, Tag, Box, AlertTriangle, AlertCircle, RefreshCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ProductEditDialog } from "@/components/products/ProductEditDialog";

interface Stats {
  totalStock: number;
  totalProducts: number;
  totalStockValue: number;
  averagePrice: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  backOrders: number;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: woocommerceSettings } = useQuery({
    queryKey: ['woocommerce-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from('woocommerce_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const fetchAllProducts = async (settings: any) => {
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
        throw new Error('Failed to fetch products from WooCommerce');
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

  const { data: products = [], refetch } = useQuery({
    queryKey: ['products', woocommerceSettings?.id],
    queryFn: async () => {
      if (!woocommerceSettings) return [];
      return fetchAllProducts(woocommerceSettings);
    },
    enabled: !!woocommerceSettings,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 15
  });

  const calculateStats = (): Stats => {
    if (!products) return {
      totalStock: 0,
      totalProducts: 0,
      totalStockValue: 0,
      averagePrice: 0,
      inStock: 0,
      outOfStock: 0,
      lowStock: 0,
      backOrders: 0
    };

    const stats = products.reduce((acc, product) => {
      const stockQuantity = product.stock_quantity || 0;
      const price = parseFloat(String(product.price)) || 0;
      const regularPrice = parseFloat(String(product.regular_price)) || price;

      return {
        totalStock: acc.totalStock + stockQuantity,
        totalProducts: acc.totalProducts + 1,
        totalStockValue: acc.totalStockValue + stockQuantity * price,
        totalRegularPrice: acc.totalRegularPrice + regularPrice,
        inStock: acc.inStock + (product.stock_status === 'instock' ? 1 : 0),
        outOfStock: acc.outOfStock + (product.stock_status === 'outofstock' ? 1 : 0),
        lowStock: acc.lowStock + (stockQuantity > 0 && stockQuantity <= 5 ? 1 : 0),
        backOrders: acc.backOrders + (product.backorders_allowed ? 1 : 0)
      };
    }, {
      totalStock: 0,
      totalProducts: 0,
      totalStockValue: 0,
      totalRegularPrice: 0,
      inStock: 0,
      outOfStock: 0,
      lowStock: 0,
      backOrders: 0
    });

    return {
      ...stats,
      averagePrice: stats.totalProducts > 0 ? stats.totalRegularPrice / stats.totalProducts : 0
    };
  };

  const stats = calculateStats();
  const overviewStats = [{
    icon: Package,
    label: "Total Stock",
    value: stats.totalStock.toString(),
    change: {
      value: "5%",
      positive: true
    }
  }, {
    icon: ShoppingBag,
    label: "Total Products",
    value: stats.totalProducts.toString(),
    change: {
      value: "3%",
      positive: true
    }
  }, {
    icon: DollarSign,
    label: "Total Stock Value",
    value: `$${stats.totalStockValue.toFixed(2)}`,
    change: {
      value: "8%",
      positive: true
    }
  }, {
    icon: Tag,
    label: "Average Product Price",
    value: `$${stats.averagePrice.toFixed(2)}`,
    change: {
      value: "2%",
      positive: true
    }
  }];
  const stockStats = [{
    icon: Box,
    label: "In Stock",
    value: stats.inStock.toString(),
    change: {
      value: "4%",
      positive: true
    }
  }, {
    icon: AlertTriangle,
    label: "Out of Stock",
    value: stats.outOfStock.toString(),
    change: {
      value: "2%",
      positive: false
    }
  }, {
    icon: AlertCircle,
    label: "Low Stock",
    value: stats.lowStock.toString(),
    change: {
      value: "1%",
      positive: false
    }
  }, {
    icon: RefreshCcw,
    label: "Back Orders",
    value: stats.backOrders.toString(),
    change: {
      value: "1%",
      positive: true
    }
  }];
  const revenueStats = [{
    icon: DollarSign,
    label: "Daily Revenue",
    value: "$0.00",
    change: {
      value: "12%",
      positive: true
    }
  }, {
    icon: DollarSign,
    label: "Weekly Revenue",
    value: "$0.00",
    change: {
      value: "8%",
      positive: true
    }
  }, {
    icon: DollarSign,
    label: "Monthly Revenue",
    value: "$0.00",
    change: {
      value: "15%",
      positive: true
    }
  }, {
    icon: DollarSign,
    label: "Yearly Revenue",
    value: "$0.00",
    change: {
      value: "25%",
      positive: true
    }
  }];

  const syncProducts = async () => {
    try {
      setIsLoading(true);
      await refetch();
      toast.success('Products refreshed successfully');
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast.error('Failed to refresh products. Please check your WooCommerce settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = async (data: any) => {
    if (!woocommerceSettings || !selectedProduct) return;

    const { woocommerce_url, consumer_key, consumer_secret } = woocommerceSettings;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);

    try {
      const response = await fetch(
        `${woocommerce_url}/wp-json/wc/v3/products/${selectedProduct.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      toast.success('Product updated successfully');
      refetch();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };

  useEffect(() => {
    document.title = "Dashboard | Woo Doctor";
  }, []);

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
    .slice(0, 20);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Welcome to Woo Doctor</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              onClick={syncProducts}
              disabled={isLoading}
            >
              <RefreshCcw className="h-4 w-4" />
              {isLoading ? 'Refreshing...' : 'Refresh Products'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="overflow-hidden animate-fade-in bg-gradient-to-br from-[#4158D0] to-[#C850C0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Business Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overviewStats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden animate-fade-in bg-gradient-to-br from-[#0093E9] to-[#80D0C7]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Stock Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stockStats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden animate-fade-in bg-gradient-to-br from-[#FF3CAC] to-[#784BA0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {revenueStats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </CardContent>
            </Card>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">Recent Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentProducts.map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    {product.images?.[0]?.src ? (
                      <img src={product.images[0].src} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gray-100">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {product.on_sale && <Badge className="absolute top-2 right-2 bg-red-500">Sale</Badge>}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.short_description?.replace(/<[^>]*>/g, '') || product.description?.replace(/<[^>]*>/g, '') || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Price</span>
                        <span className="font-semibold">
                          ${parseFloat(String(product.price || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stock</span>
                        <Badge variant={product.stock_status === 'instock' ? 'default' : 'destructive'}>
                          {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                      {product.stock_quantity !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Quantity</span>
                          <span>{product.stock_quantity}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <a href={product.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        View <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleProductEdit(product)}
                    >
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>

      <ProductEditDialog
        product={selectedProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveProduct}
        woocommerceSettings={woocommerceSettings}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
