import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Import, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { StoreSelector } from "./StoreSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Progress } from "@/components/ui/progress";
import { 
  createProduct, 
  fetchProceedProducts, 
  getProductBySku, 
  updateProduct, 
  createCategoryIfNotExists,
  normalizeProductType
} from "@/services/woocommerce-service";
import { Card, CardContent } from "@/components/ui/card";
import { processXmlCategories, processXmlImages } from './utils/importUtils';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ImportButtonProps {
  productCount: number;
  isLoading?: boolean;
  delayTime?: number;
}

interface SavedFile {
  id: string;
  filename: string;
  created_at: string;
}

export function ImportButton({ productCount, isLoading = false, delayTime = 0 }: ImportButtonProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [useAllProducts, setUseAllProducts] = useState(false);
  const [importStats, setImportStats] = useState({
    currentBatch: 0,
    totalBatches: 0,
    importedProducts: 0,
    totalProducts: 0,
    remainingProducts: 0,
    currentProduct: '',
    successCount: 0,
    failureCount: 0
  });

  const handleImportClick = () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start importing products.",
        variant: "destructive"
      });
      return;
    }

    if (!delayTime || delayTime <= 0) {
      toast({
        title: "Delay Time Required",
        description: "Please set a delay time between batches to prevent API rate limiting.",
        variant: "destructive"
      });
      return;
    }

    if (productCount === 0) {
      toast({
        title: "No Products",
        description: "There are no products to import.",
        variant: "destructive"
      });
      return;
    }

    fetchSavedFiles();
    setImportDialogOpen(true);
  };

  const fetchSavedFiles = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('import_files')
        .select('id, filename, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedFiles(data || []);
    } catch (error) {
      console.error('Error fetching saved files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch saved files",
        variant: "destructive",
      });
    }
  };

  const startImport = async () => {
    if (!user?.id || !selectedStoreId) {
      toast({
        title: "Selection Required",
        description: "Please select a store to start importing.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFileId && !useAllProducts) {
      toast({
        title: "Selection Required",
        description: "Please select a file or choose to use all products.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);
      
      const { data: storeSettings, error: storeError } = await supabase
        .from('woocommerce_settings')
        .select('*')
        .eq('id', selectedStoreId)
        .single();
      
      if (storeError) throw storeError;
      
      if (!storeSettings) {
        throw new Error("Store settings not found");
      }
      
      // First get all products for the user
      const allProducts = await fetchProceedProducts(user.id);
      
      let productsToImport = allProducts;
      
      // Filter by file ID if not using all products
      if (!useAllProducts && selectedFileId) {
        productsToImport = allProducts.filter(product => 
          product.import_file_id === selectedFileId
        );
        
        console.log("Total products:", allProducts.length, "File products:", productsToImport.length, "Selected file ID:", selectedFileId);
        
        if (productsToImport.length === 0) {
          // If no products with the specific file ID, check if there are any products with NULL import_file_id
          const productsWithNullFileId = allProducts.filter(product => !product.import_file_id);
          
          if (productsWithNullFileId.length > 0) {
            // Ask user if they want to use products with no file association
            if (confirm(`No products found for the selected file, but ${productsWithNullFileId.length} products without file association were found. Would you like to use those instead?`)) {
              productsToImport = productsWithNullFileId;
            } else {
              throw new Error("No products found for the selected file. Please make sure you've saved products from this file first.");
            }
          } else {
            throw new Error("No products found for the selected file. Please make sure you've saved products from this file first.");
          }
        }
      } else {
        console.log("Using all products for import:", allProducts.length);
      }
      
      if (productsToImport.length === 0) {
        throw new Error("No products found to import. Please save products first.");
      }
      
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(productsToImport.length / BATCH_SIZE);
      
      setImportStats({
        currentBatch: 0,
        totalBatches,
        importedProducts: 0,
        totalProducts: productsToImport.length,
        remainingProducts: productsToImport.length,
        currentProduct: '',
        successCount: 0,
        failureCount: 0
      });
      
      // Make sure all products have status set to 'publish' if missing
      productsToImport = productsToImport.map(product => ({
        ...product,
        status: product.status || 'publish'
      }));
      
      await processImportBatches(productsToImport, storeSettings, BATCH_SIZE);
      
    } catch (error) {
      console.error('Error starting import:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to start the import process",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const processImportBatches = async (products, storeSettings, batchSize) => {
    const totalProducts = products.length;
    let importedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    let currentBatch = 1;
    
    // Process each batch
    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      setImportStats(prev => ({
        ...prev,
        currentBatch,
        totalBatches: Math.ceil(totalProducts / batchSize)
      }));
      
      // Process this batch product by product
      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const productIndex = i + j;
        const overallProgress = ((productIndex + 1) / totalProducts) * 100;
        
        // Update UI for current product before processing
        setImportStats(prev => ({
          ...prev,
          currentProduct: product.name || `Product ${productIndex + 1}`,
          importedProducts: productIndex,
          remainingProducts: totalProducts - productIndex
        }));
        
        try {
          // Process single product
          const originalSku = product.sku || "";
          let existingProduct = null;
          
          if (originalSku) {
            existingProduct = await getProductBySku(originalSku, storeSettings);
          }
          
          const wooProduct = await prepareProductForWooCommerce(product, storeSettings);
          
          if (existingProduct) {
            await updateProduct(existingProduct.id, wooProduct, storeSettings);
            console.log(`Updated existing product with SKU ${originalSku} (${wooProduct.sku})`);
          } else {
            await createProduct(wooProduct, storeSettings);
            console.log(`Created new product with SKU ${wooProduct.sku}`);
          }
          
          successCount++;
          setImportStats(prev => ({
            ...prev,
            successCount
          }));
        } catch (error) {
          console.error(`Error importing product ${product.name}:`, error);
          failureCount++;
          setImportStats(prev => ({
            ...prev,
            failureCount
          }));
        }
        
        // Update progress after each product
        importedCount = productIndex + 1;
        setImportProgress(overallProgress);
        
        // Small delay to prevent UI freezing and allow progress updates to render
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // After batch complete
      const progress = Math.floor((importedCount / totalProducts) * 100);
      setImportProgress(progress);
      
      // Only show a toast notification after each batch
      toast({
        title: `Batch ${currentBatch} Progress`,
        description: `Processed ${importedCount} of ${totalProducts} products (${successCount} successful, ${failureCount} failed)`,
      });
      
      currentBatch++;
      
      // Add delay between batches if specified and there are more batches to process
      if (i + batchSize < totalProducts && delayTime > 0) {
        await new Promise(resolve => setTimeout(resolve, delayTime * 1000));
      }
    }
    
    // Final progress update
    setImportProgress(100);
    setImportStats(prev => ({
      ...prev,
      importedProducts: totalProducts,
      remainingProducts: 0,
      successCount,
      failureCount
    }));
    
    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} of ${totalProducts} products (${failureCount} failed)`,
    });
  };

  const generateRandomSku = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const prepareProductForWooCommerce = async (product, storeSettings) => {
    const originalSku = product.sku || "";
    
    const skuSuffix = `-${generateRandomSku()}`;
    const finalSku = originalSku ? originalSku + skuSuffix : generateRandomSku();
    
    let categories = [];
    if (product.categories) {
      try {
        let categoryNames = [];
        
        if (typeof product.categories === 'string') {
          if (product.categories.includes('\n')) {
            categoryNames = processXmlCategories(product.categories);
          } else {
            try {
              const parsed = JSON.parse(product.categories);
              categoryNames = Array.isArray(parsed) ? parsed : [product.categories];
            } catch {
              categoryNames = product.categories.split(',').map(cat => cat.trim()).filter(Boolean);
            }
          }
        } else if (Array.isArray(product.categories)) {
          categoryNames = product.categories;
        }
        
        for (const categoryName of categoryNames) {
          if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
            continue;
          }
          
          try {
            const cleanCategoryName = categoryName.trim();
            const categoryId = await createCategoryIfNotExists(cleanCategoryName, storeSettings);
            if (categoryId) {
              categories.push({ id: categoryId });
            }
          } catch (error) {
            console.error(`Error creating category ${categoryName}:`, error);
            categories.push({ name: categoryName.trim() });
          }
        }
      } catch (e) {
        console.error("Error processing categories:", e);
        if (typeof product.categories === 'string') {
          const categoryNames = product.categories.split(/[,\n]/).map(cat => cat.trim()).filter(Boolean);
          categories = categoryNames.map(name => ({ name }));
        }
      }
    }
    
    let images = [];
    if (product.images) {
      try {
        let imageUrls = [];
        
        if (typeof product.images === 'string') {
          if (product.images.includes('\n')) {
            imageUrls = processXmlImages(product.images);
          } else {
            try {
              const parsed = JSON.parse(product.images);
              imageUrls = Array.isArray(parsed) ? parsed : [product.images];
            } catch {
              imageUrls = product.images.split(',').map(img => img.trim()).filter(Boolean);
            }
          }
        } else if (Array.isArray(product.images)) {
          imageUrls = product.images;
        }
        
        images = imageUrls.map(url => {
          if (typeof url === 'string') {
            if (url.startsWith('http')) {
              return { src: url };
            }
            const baseUrl = "https://images.williams-trading.com/product_images";
            const cleanPath = url.startsWith('/') ? url.substring(1) : url;
            return { src: `${baseUrl}/${cleanPath}` };
          }
          return url;
        });
      } catch (e) {
        console.error("Error processing images:", e);
      }
    }
    
    let stockQuantity = 0;
    if (product.stock_quantity !== undefined && product.stock_quantity !== null) {
      const parsedQuantity = parseInt(product.stock_quantity.toString(), 10);
      stockQuantity = !isNaN(parsedQuantity) ? parsedQuantity : 0;
    }
    
    let status = 'publish';
    if (product.status) {
      if (product.status.toLowerCase() === 'instock') {
        status = 'publish';
      } else if (product.status.toLowerCase() === 'outofstock') {
        status = 'draft';
      } else {
        const validStatuses = ['draft', 'pending', 'private', 'publish'];
        status = validStatuses.includes(product.status) ? product.status : 'publish';
      }
    }
    
    const productType = normalizeProductType(product.type);
    
    return {
      name: product.name,
      description: product.description || "",
      short_description: product.short_description || "",
      regular_price: product.regular_price ? String(product.regular_price) : "",
      sale_price: product.sale_price ? String(product.sale_price) : "",
      categories,
      images,
      sku: finalSku,
      stock_quantity: stockQuantity,
      status,
      type: productType,
      virtual: product.virtual || false,
      downloadable: product.downloadable || false,
    };
  };

  return (
    <>
      <Button
        onClick={handleImportClick}
        className="w-full mt-4 gap-2"
        size="lg"
        disabled={isLoading || isImporting || productCount === 0 || !delayTime || delayTime <= 0}
      >
        {isLoading || isImporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isImporting ? 'Importing...' : 'Loading...'}
          </>
        ) : (
          <>
            <Import className="h-5 w-5" />
            Start Import ({productCount} Products to WooCommerce)
          </>
        )}
      </Button>
      
      {isImporting && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Batch: {importStats.currentBatch}/{importStats.totalBatches}</span>
                  <span>Imported: {importStats.importedProducts}/{importStats.totalProducts}</span>
                </div>
                <Progress value={importProgress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress: {Math.round(importProgress)}%</span>
                  <span>Remaining: {importStats.remainingProducts} products</span>
                </div>
              </div>
              
              {importStats.currentProduct && (
                <div className="border rounded-md p-3 bg-muted/50">
                  <p className="text-sm font-medium">Currently importing:</p>
                  <p className="text-sm truncate">{importStats.currentProduct}</p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-green-600">Success: {importStats.successCount}</span>
                    <span className="text-red-600">Failed: {importStats.failureCount}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products to WooCommerce</DialogTitle>
            <DialogDescription>
              Select a file and store to begin importing products.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select File</label>
              <Select 
                value={selectedFileId} 
                onValueChange={setSelectedFileId}
                disabled={useAllProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a file" />
                </SelectTrigger>
                <SelectContent>
                  {savedFiles.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.filename} ({new Date(file.created_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="useAllProducts" 
                checked={useAllProducts} 
                onCheckedChange={(checked) => {
                  setUseAllProducts(!!checked);
                  if (checked) {
                    setSelectedFileId("");
                  }
                }}
              />
              <Label htmlFor="useAllProducts">
                Use all products (ignore file selection)
              </Label>
            </div>
            
            <StoreSelector
              selectedStoreId={selectedStoreId}
              onStoreSelect={setSelectedStoreId}
            />
            
            <Button
              onClick={startImport}
              disabled={isImporting || !selectedStoreId || (!selectedFileId && !useAllProducts)}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
