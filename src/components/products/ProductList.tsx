import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  X, 
  DollarSign,
  Percent,
  BarChart,
  Database,
  Tag
} from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { ProductEditDialog } from "./ProductEditDialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BulkEditDialog } from "./BulkEditDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  short_description?: string;
  description?: string;
  price?: string | number;
  stock_status: string;
  stock_quantity: number | null;
  on_sale: boolean;
  images?: { src: string }[];
  permalink?: string;
  regular_price?: string;
  sale_price?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
}

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  woocommerceSettings?: any;
}

export const ProductList = ({ products, isLoading, woocommerceSettings }: ProductListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkEditOperation, setBulkEditOperation] = useState<string>("increase");
  const [bulkEditValue, setBulkEditValue] = useState<string>("");
  const [bulkEditField, setBulkEditField] = useState<string>("regular_price");
  const [bulkEditType, setBulkEditType] = useState<string>("percent");
  const [stockStatus, setStockStatus] = useState<string>("instock");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productsPerPage = 50;

  const { data: woocommerceSettingsData } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('woocommerce_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !woocommerceSettings,
  });

  const effectiveWoocommerceSettings = woocommerceSettings || woocommerceSettingsData;

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!effectiveWoocommerceSettings || !selectedProduct) {
        throw new Error('Missing required settings or product');
      }

      const { woocommerce_url, consumer_key, consumer_secret } = effectiveWoocommerceSettings;
      const auth = btoa(`${consumer_key}:${consumer_secret}`);

      const response = await fetch(`${woocommerce_url}/wp-json/wc/v3/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          regular_price: data.regular_price,
          sale_price: data.sale_price,
          description: data.description,
          short_description: data.short_description,
          stock_status: data.stock_status,
          stock_quantity: data.stock_quantity,
          on_sale: data.on_sale,
          dimensions: data.dimensions,
          weight: data.weight,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      
      queryClient.setQueryData(['wc-products'], (oldData: Product[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(product => 
          product.id === updatedProduct.id ? updatedProduct : product
        );
      });

      return updatedProduct;
    },
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!effectiveWoocommerceSettings) {
        throw new Error('Missing required settings');
      }

      const { woocommerce_url, consumer_key, consumer_secret } = effectiveWoocommerceSettings;
      const auth = btoa(`${consumer_key}:${consumer_secret}`);

      const response = await fetch(`${woocommerce_url}/wp-json/wc/v3/products/${productId}?force=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      if (!effectiveWoocommerceSettings) {
        throw new Error('Missing required settings');
      }

      const { woocommerce_url, consumer_key, consumer_secret } = effectiveWoocommerceSettings;
      const auth = btoa(`${consumer_key}:${consumer_secret}`);

      let successCount = 0;
      let errorCount = 0;
      const total = productIds.length;
      setIsBulkDeleting(true);
      setBulkDeleteProgress(0);

      for (let i = 0; i < productIds.length; i++) {
        try {
          const response = await fetch(`${woocommerce_url}/wp-json/wc/v3/products/${productIds[i]}?force=true`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${auth}`,
            },
          });

          if (!response.ok) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          errorCount++;
        }

        const progress = Math.round(((i + 1) / total) * 100);
        setBulkDeleteProgress(progress);
      }

      return { successCount, errorCount, total };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      
      toast({
        title: "Bulk Delete Complete",
        description: `Successfully deleted ${result.successCount} out of ${result.total} products`,
      });
      setIsBulkDeleteOpen(false);
      setSelectedProducts([]);
      setSelectAll(false);
      setIsBulkDeleting(false);
    },
    onError: (error: Error) => {
      console.error('Error in bulk delete:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete products",
        variant: "destructive",
      });
      setIsBulkDeleting(false);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      productIds,
      updateData
    }: {
      productIds: number[];
      updateData: any;
    }) => {
      if (!effectiveWoocommerceSettings) {
        throw new Error('Missing required settings');
      }

      const { woocommerce_url, consumer_key, consumer_secret } = effectiveWoocommerceSettings;
      const auth = btoa(`${consumer_key}:${consumer_secret}`);

      let successCount = 0;
      let errorCount = 0;
      const total = productIds.length;
      setBulkDeleteProgress(0);

      for (let i = 0; i < productIds.length; i++) {
        try {
          const response = await fetch(`${woocommerce_url}/wp-json/wc/v3/products/${productIds[i]}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          errorCount++;
        }

        const progress = Math.round(((i + 1) / total) * 100);
        setBulkDeleteProgress(progress);
      }

      return { successCount, errorCount, total };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      
      toast({
        title: "Bulk Update Complete",
        description: `Successfully updated ${result.successCount} out of ${result.total} products`,
      });
      setIsBulkEditOpen(false);
      setSelectedProducts([]);
      setSelectAll(false);
    },
    onError: (error: Error) => {
      console.error('Error in bulk update:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update products",
        variant: "destructive",
      });
    },
  });

  const handleBulkEdit = async () => {
    const productIds = selectedProducts.map(product => product.id);
    const updateData: any = {};

    if (bulkEditField === "stock_status") {
      updateData.stock_status = stockStatus;
    } else {
      const selectedProducts = products.filter(product => 
        selectedProducts.some(selected => selected.id === product.id)
      );

      if (bulkEditType === "percent") {
        const percentValue = parseFloat(bulkEditValue) / 100;
        
        for (const product of selectedProducts) {
          let originalValue = 0;
          
          if (bulkEditField === "regular_price" && product.regular_price) {
            originalValue = parseFloat(product.regular_price);
          } else if (bulkEditField === "sale_price" && product.sale_price) {
            originalValue = parseFloat(product.sale_price);
          }
          
          if (originalValue > 0) {
            const change = originalValue * percentValue;
            const newValue = bulkEditOperation === "increase" 
              ? originalValue + change 
              : originalValue - change;
            
            updateData[bulkEditField] = newValue.toFixed(2);
          }
        }
      } else if (bulkEditType === "fixed") {
        const fixedValue = parseFloat(bulkEditValue);
        
        for (const product of selectedProducts) {
          let originalValue = 0;
          
          if (bulkEditField === "regular_price" && product.regular_price) {
            originalValue = parseFloat(product.regular_price);
          } else if (bulkEditField === "sale_price" && product.sale_price) {
            originalValue = parseFloat(product.sale_price);
          }
          
          if (originalValue > 0) {
            const newValue = bulkEditOperation === "increase" 
              ? originalValue + fixedValue 
              : originalValue - fixedValue;
            
            updateData[bulkEditField] = newValue.toFixed(2);
          }
        }
      }
    }

    await bulkUpdateMutation.mutate({ productIds, updateData });
  };

  const DeleteConfirmationDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void;
  }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveProduct = async (data: any) => {
    await updateProductMutation.mutate(data);
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      await deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  const handleBulkDeleteProducts = async () => {
    const productIds = selectedProducts.map(product => product.id);
    await bulkDeleteMutation.mutate(productIds);
  };

  const toggleSelectProduct = (product: Product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts([...currentProducts]);
    }
    setSelectAll(!selectAll);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push('...');
      }
    }
    return pageNumbers;
  };

  return (
    <div className="space-y-6">
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-lg p-4 flex items-center gap-4 animate-slide-up">
          <Badge variant="default" className="px-2 py-1">
            {selectedProducts.length} selected
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProducts([]);
                setSelectAll(false);
              }}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              Bulk Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectAll}
            onCheckedChange={toggleSelectAll}
          />
          <Label htmlFor="select-all" className="cursor-pointer">
            Select All
          </Label>
        </div>
        <div className="text-sm text-muted-foreground">
          {products.length} products total
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.map((product) => (
          <Card 
            key={product.id} 
            className={cn(
              "group relative overflow-hidden bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/40",
              selectedProducts.some(p => p.id === product.id) && "ring-2 ring-primary"
            )}
          >
            <div className="absolute top-2 left-2 z-20">
              <Checkbox
                checked={selectedProducts.some(p => p.id === product.id)}
                onCheckedChange={() => toggleSelectProduct(product)}
                className="h-5 w-5 bg-white/90 dark:bg-gray-700/90 rounded-sm border-gray-300 dark:border-gray-600"
              />
            </div>
            
            <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-700">
              {product.images?.[0]?.src ? (
                <img
                  src={product.images[0].src}
                  alt={product.name}
                  className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-700">
                  <Package className="h-12 w-12 text-gray-300 dark:text-gray-500" />
                </div>
              )}
              {product.on_sale && (
                <Badge className="absolute top-2 right-2 bg-red-500 shadow-lg animate-fade-in">
                  Sale
                </Badge>
              )}
            </div>

            <CardHeader className="space-y-2 p-4">
              <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-primary transition-colors duration-200 dark:text-white">
                {product.name}
              </h3>
              <CardDescription className="line-clamp-2 text-sm text-gray-500 dark:text-gray-300">
                {product.short_description?.replace(/<[^>]*>/g, '') || 
                 product.description?.replace(/<[^>]*>/g, '') || 
                 'No description available'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</span>
                  <span className="text-lg font-bold text-primary">
                    ${parseFloat(String(product.price || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock</span>
                  <Badge
                    variant={product.stock_status === 'instock' ? 'default' : 'destructive'}
                    className="shadow-sm transition-all duration-200 hover:shadow"
                  >
                    {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
                {product.stock_quantity !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</span>
                    <span className="font-semibold dark:text-white">{product.stock_quantity}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.permalink) {
                    window.open(product.permalink, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full transition-all duration-200 hover:bg-primary hover:text-white group/btn relative z-10"
              >
                <span className="flex items-center justify-center gap-2">
                  View
                  <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </span>
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(product);
                }}
                className="w-full flex items-center justify-center gap-2 transition-all duration-200 relative z-10"
              >
                Edit
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(product);
                }}
                className="w-full flex items-center justify-center gap-2 transition-all duration-200 relative z-10"
              >
                Delete
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              {currentPage === 1 ? (
                <span className="opacity-50 transition-opacity duration-200">
                  <PaginationPrevious className="cursor-not-allowed" onClick={() => {}} />
                </span>
              ) : (
                <PaginationPrevious 
                  className="transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-white active:scale-95" 
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                />
              )}
            </PaginationItem>
            
            {getPageNumbers().map((pageNumber, index) => (
              <PaginationItem key={index}>
                {pageNumber === '...' ? (
                  <span className="px-4 py-2 text-gray-400">...</span>
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(Number(pageNumber))}
                    isActive={currentPage === pageNumber}
                    className={`transition-all duration-200 hover:scale-105 active:scale-95
                      ${currentPage === pageNumber 
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'hover:bg-primary/10'}`}
                  >
                    {pageNumber}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              {currentPage === totalPages ? (
                <span className="opacity-50 transition-opacity duration-200">
                  <PaginationNext className="cursor-not-allowed" onClick={() => {}} />
                </span>
              ) : (
                <PaginationNext 
                  className="transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-white active:scale-95" 
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="text-sm text-gray-500 text-center mt-4 animate-fade-in">
        Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} products
      </div>

      <ProductEditDialog 
        product={selectedProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveProduct}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteProduct}
      />

      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Bulk Delete Products
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProducts.length} products? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {isBulkDeleting && (
            <div className="py-4">
              <Progress value={bulkDeleteProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Deleting products... {bulkDeleteProgress}%
              </p>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)} disabled={isBulkDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDeleteProducts}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete Products'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Bulk Edit Products</SheetTitle>
            <SheetDescription>
              Make changes to {selectedProducts.length} selected products
            </SheetDescription>
          </SheetHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select field to edit</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={bulkEditField === "regular_price" ? "default" : "outline"}
                  onClick={() => setBulkEditField("regular_price")}
                  className="w-full justify-start"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Regular Price
                </Button>
                <Button
                  variant={bulkEditField === "sale_price" ? "default" : "outline"}
                  onClick={() => setBulkEditField("sale_price")}
                  className="w-full justify-start"
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Sale Price
                </Button>
                <Button
                  variant={bulkEditField === "stock_status" ? "default" : "outline"}
                  onClick={() => setBulkEditField("stock_status")}
                  className="w-full justify-start"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Stock Status
                </Button>
              </div>
            </div>

            {bulkEditField === "stock_status" ? (
              <div className="grid gap-2">
                <Label>Stock Status</Label>
                <RadioGroup 
                  value={stockStatus} 
                  onValueChange={setStockStatus}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="instock" id="instock" />
                    <Label htmlFor="instock">In Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outofstock" id="outofstock" />
                    <Label htmlFor="outofstock">Out of Stock</Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Operation</Label>
                  <RadioGroup 
                    value={bulkEditOperation} 
                    onValueChange={setBulkEditOperation}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="increase" id="increase" />
                      <Label htmlFor="increase">Increase</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="decrease" id="decrease" />
                      <Label htmlFor="decrease">Decrease</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Type</Label>
                  <RadioGroup 
                    value={bulkEditType} 
                    onValueChange={setBulkEditType}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percent" id="percent" />
                      <Label htmlFor="percent">Percentage (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed">Fixed Amount ($)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Value</Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      {bulkEditType === "percent" ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step={bulkEditType === "percent" ? "1" : "0.01"}
                      value={bulkEditValue}
                      onChange={(e) => setBulkEditValue(e.target.value)}
                      className="flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={bulkEditType === "percent" ? "10" : "5.99"}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {bulkUpdateMutation.isPending && (
            <div className="py-4">
              <Progress value={bulkDeleteProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Updating products... {bulkDeleteProgress}%
              </p>
            </div>
          )}
          
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkEdit}
              disabled={
                bulkUpdateMutation.isPending || 
                (bulkEditField !== "stock_status" && !bulkEditValue)
              }
            >
              {bulkUpdateMutation.isPending ? 'Updating...' : 'Apply Changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
