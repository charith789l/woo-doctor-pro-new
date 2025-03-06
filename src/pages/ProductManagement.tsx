
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductFormValues } from "@/components/products/ProductForm";
import { ProductImporter } from "@/components/products/ProductImporter";
import { useToast } from "@/hooks/use-toast";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductsTabContent } from "@/components/products/ProductsTabContent";
import { CategoryManagement } from "@/components/products/CategoryManagement";
import { BulkUpdateSection } from "@/components/products/BulkUpdateSection";
import { fetchAllCategories, fetchAllProducts, createProduct, updateProduct } from "@/services/woocommerce-service";
import { Progress } from "@/components/ui/progress";

const queryClient = new QueryClient();

const ProductManagementContent = () => {
  const [updateProgress, setUpdateProgress] = useState({ processed: 0, total: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  const { user } = useAuthStore();

  const { data: woocommerceSettings } = useQuery({
    queryKey: ['woocommerce-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('woocommerce_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['wc-categories', woocommerceSettings?.id],
    queryFn: async () => {
      if (!woocommerceSettings) {
        return [];
      }
      return fetchAllCategories(woocommerceSettings);
    },
    enabled: !!woocommerceSettings,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      if (!woocommerceSettings) {
        throw new Error('WooCommerce settings not found');
      }
      return createProduct(data, woocommerceSettings);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      refetchProducts();
    },
    onError: (error: Error) => {
      console.error('Product creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['wc-products', woocommerceSettings?.id],
    queryFn: async () => {
      if (!woocommerceSettings) {
        return [];
      }
      return fetchAllProducts(woocommerceSettings);
    },
    enabled: !!woocommerceSettings,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    refetchInterval: 1000 * 60 * 15 // Refetch every 15 minutes
  });

  const handleBulkPriceUpdate = async (data: any) => {
    if (!woocommerceSettings) {
      toast({
        title: "Error",
        description: "WooCommerce settings not found",
        variant: "destructive",
      });
      return;
    }

    const { woocommerce_url, consumer_key, consumer_secret } = woocommerceSettings;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);

    let successCount = 0;
    let errorCount = 0;
    const totalProducts = (products || []).length;

    setIsUpdating(true);
    setUpdateProgress({ processed: 0, total: totalProducts });
    const setProgressValue = (processed: number) => {
      const percentage = (processed / totalProducts) * 100;
      setProgress(percentage);
      setUpdateProgress({ processed, total: totalProducts });
    };

    try {
      const productsArray = [...(products || [])];

      for (let i = 0; i < productsArray.length; i++) {
        const product = productsArray[i];
        try {
          const currentPrice = parseFloat(
            data.priceType === "regular_price"
              ? product.regular_price || "0"
              : product.sale_price || "0"
          );

          if (currentPrice === 0) {
            setProgressValue(i + 1);
            continue;
          }

          const percentageMultiplier = data.percentage / 100;
          const priceChange = currentPrice * percentageMultiplier;
          
          const newPrice = data.operation === "increase"
            ? currentPrice + priceChange
            : currentPrice - priceChange;

          // Define the update data with proper type
          const updateData: {
            [key: string]: string | number | boolean;
            stock_quantity: number;
            manage_stock: boolean;
          } = { 
            [data.priceType]: newPrice.toFixed(2),
            stock_quantity: parseInt(product.stock_quantity || "0", 10),
            manage_stock: true,
          };
          
          // Set stock status separately after defining the object
          if (product.stock_quantity !== undefined) {
            const stockQty = parseInt(product.stock_quantity, 10);
            updateData.stock_status = stockQty > 0 ? 'instock' : 'outofstock';
          }

          await updateProduct(
            product.id,
            updateData,
            woocommerceSettings
          );

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error);
          errorCount++;
        }

        setProgressValue(i + 1);

        if ((i + 1) % Math.ceil(totalProducts / 4) === 0) {
          toast({
            title: "Progress",
            description: `Updated ${i + 1} out of ${totalProducts} products...`,
          });
        }
      }

      toast({
        title: "Update Complete",
        description: `Successfully updated ${successCount} products${
          errorCount > 0 ? ` (${errorCount} failed)` : ""
        }`,
      });

      await refetchProducts();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Error",
        description: "Failed to complete the bulk update operation",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setUpdateProgress({ processed: 0, total: 0 });
      setProgress(0);
    }
  };

  return (
    <DashboardLayout>
      <ProductTabs
        productsTabContent={
          <ProductsTabContent
            products={products || []}
            categories={categories || []}
            isLoading={isLoadingProducts}
            woocommerceSettings={woocommerceSettings}
          />
        }
        createTabContent={
          <ProductForm
            categories={categories || []}
            onSubmit={(data) => createProductMutation.mutate(data)}
            isSubmitting={createProductMutation.isPending}
          />
        }
        importTabContent={<ProductImporter />}
        categoriesTabContent={
          <CategoryManagement
            categories={categories || []}
            woocommerceSettings={woocommerceSettings}
          />
        }
        bulkTabContent={
          <BulkUpdateSection
            onBulkUpdate={handleBulkPriceUpdate}
            isUpdating={isUpdating}
            progress={progress}
            updateProgress={updateProgress}
          />
        }
        onRefresh={refetchProducts}
      />
    </DashboardLayout>
  );
};

const ProductManagement = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductManagementContent />
    </QueryClientProvider>
  );
};

export default ProductManagement;
