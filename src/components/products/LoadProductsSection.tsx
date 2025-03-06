
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileJson, Upload, Image as ImageIcon, Tag, ChevronDown, ChevronUp, Timer, Save, Trash2 } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { truncateText } from './utils/importUtils';
import { PreviewProduct } from './types/import-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ImportButton } from './ImportButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createProceedProduct, fetchProceedProducts, deleteAllProceedProducts, batchCreateProceedProducts } from "@/services/woocommerce-service";
import { Progress } from "@/components/ui/progress";

interface SavedFile {
  id: string;
  filename: string;
  created_at: string;
}

interface SavedMapping {
  id: string;
  file_field_name: string;
  woocommerce_field: string;
}

export function LoadProductsSection({ fileId }: { fileId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>(fileId || '');
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileType, setFileType] = useState<'csv' | 'xml' | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<{field: string, content: string} | null>(null);
  const [batchDelayTime, setBatchDelayTime] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedProductCount, setSavedProductCount] = useState<number>(0);
  const [saveProgress, setSaveProgress] = useState(0);
  const [productSaveStatus, setProductSaveStatus] = useState({ saved: 0, total: 0 });
  const [isFileDataLoaded, setIsFileDataLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const productsPerPage = 10;
  
  // Add the fetchSavedProductsCount function that was missing
  const fetchSavedProductsCount = async () => {
    if (!user?.id) return;
    
    try {
      const { count, error } = await supabase
        .from('proceed_products')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (error) throw error;
      console.log('Fetched saved products count:', count);
      setSavedProductCount(count || 0);
    } catch (error) {
      console.error('Error fetching saved products count:', error);
    }
  };
  
  useEffect(() => {
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
          description: "Failed to load saved files",
          variant: "destructive",
        });
      }
    };
    
    fetchSavedFiles();
  }, [user?.id, toast]);

  useEffect(() => {
    fetchSavedProductsCount();
  }, [user?.id]);

  useEffect(() => {
    const currentFileId = selectedFileId || fileId;
    
    if (currentFileId) {
      setIsFileDataLoaded(false);
      const loadInitialFileData = async () => {
        try {
          const result = await loadMappingsForFile(currentFileId);
          if (result && result.fileContent && result.fileType && result.mappings) {
            setIsFileDataLoaded(true);
          }
        } catch (error) {
          console.error('Error loading initial file data:', error);
        }
      };
      
      loadInitialFileData();
    }
  }, [selectedFileId, fileId]);
  
  const loadMappingsForFile = async (fileId: string): Promise<{fileContent: string, fileType: 'csv' | 'xml', mappings: { [key: string]: string }} | null> => {
    try {
      const { data: fileData, error: fileError } = await supabase
        .from('import_files')
        .select('content, file_type')
        .eq('id', fileId)
        .single();
      
      if (fileError) throw fileError;
      
      if (!fileData || !fileData.content || !fileData.file_type) {
        throw new Error("File data is incomplete");
      }
      
      setFileContent(fileData.content);
      setFileType(fileData.file_type as 'csv' | 'xml');
      
      const { data, error } = await supabase
        .from('import_file_mappings')
        .select('file_field_name, woocommerce_field')
        .eq('import_file_id', fileId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newMappings: { [key: string]: string } = {};
        data.forEach(mapping => {
          newMappings[mapping.file_field_name] = mapping.woocommerce_field;
        });
        setMappings(newMappings);
        
        return {
          fileContent: fileData.content,
          fileType: fileData.file_type as 'csv' | 'xml',
          mappings: newMappings
        };
      } else {
        toast({
          title: "Warning",
          description: "No mappings found for this file",
          variant: "destructive",
        });
        return {
          fileContent: fileData.content,
          fileType: fileData.file_type as 'csv' | 'xml',
          mappings: {}
        };
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast({
        title: "Error",
        description: "Failed to load mappings",
        variant: "destructive",
      });
      return null;
    }
  };
  
  const parseFile = (content: string, type: 'csv' | 'xml', mappings: { [key: string]: string }) => {
    if (type === 'csv') {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) return { products: [], total: 0 };
      
      const headers = parseCsvLine(lines[0]);
      const allProducts = lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const product: PreviewProduct = {};
        
        Object.entries(mappings).forEach(([fileField, wooField]) => {
          const fieldIndex = headers.indexOf(fileField);
          if (fieldIndex !== -1 && fieldIndex < values.length) {
            let value = values[fieldIndex];
            
            if (wooField === 'images' && value) {
              try {
                const parsed = JSON.parse(value);
                value = Array.isArray(parsed) ? JSON.stringify(parsed) : value;
              } catch {
                // Not JSON, leave as is
              }
            } else if ((wooField === 'categories' || wooField === 'tags') && value) {
              try {
                const parsed = JSON.parse(value);
                value = Array.isArray(parsed) ? JSON.stringify(parsed) : value;
              } catch {
                // If not JSON, try to handle comma-separated values
                if (value.includes(',')) {
                  value = JSON.stringify(value.split(',').map(v => v.trim()).filter(Boolean));
                }
              }
            }
            
            product[wooField] = value;
          }
        });
        
        return product;
      });
      
      return { products: allProducts, total: allProducts.length };
    } else if (type === 'xml') {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        const productNodes = xmlDoc.getElementsByTagName('product');
        const allProducts: PreviewProduct[] = [];
        
        for (let i = 0; i < productNodes.length; i++) {
          const product: PreviewProduct = {};
          const productNode = productNodes[i];
          
          Object.entries(mappings).forEach(([fileField, wooField]) => {
            const elements = productNode.getElementsByTagName(fileField);
            if (elements.length > 0) {
              let value = elements[0].textContent || '';
              
              if ((wooField === 'categories' || wooField === 'tags') && value.includes(',')) {
                value = JSON.stringify(value.split(',').map(v => v.trim()).filter(Boolean));
              }
              
              product[wooField] = value;
            }
          });
          
          allProducts.push(product);
        }
        
        return { products: allProducts, total: allProducts.length };
      } catch (error) {
        console.error('Error parsing XML:', error);
        return { products: [], total: 0 };
      }
    }
    
    return { products: [], total: 0 };
  };
  
  const parseCsvLine = (line: string): string[] => {
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
  
  const handleLoadProducts = async () => {
    if (!selectedFileId) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fileData = await loadMappingsForFile(selectedFileId);
      
      if (!fileData) {
        throw new Error("Failed to load file data");
      }
      
      const { fileContent: currentFileContent, fileType: currentFileType, mappings: currentMappings } = fileData;
      
      if (!currentFileContent || !currentFileType) {
        throw new Error("File content or type not available");
      }
      
      if (Object.keys(currentMappings).length === 0) {
        toast({
          title: "Warning",
          description: "This file has no field mappings set up. Please configure mappings first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const { products: parsedProducts, total } = parseFile(currentFileContent, currentFileType, currentMappings);
      
      if (parsedProducts.length === 0) {
        toast({
          title: "Warning",
          description: "No products could be parsed from this file. Please check the file format and mappings.",
          variant: "destructive",
        });
      } else {
        setProducts(parsedProducts);
        setTotalProducts(total);
        setCurrentPage(1);
        
        toast({
          title: "Success",
          description: `Loaded ${total} products successfully`,
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileSelect = async (id: string) => {
    setSelectedFileId(id);
    
    setProducts([]);
    setTotalProducts(0);
    
    setIsFileDataLoaded(false);
    try {
      const result = await loadMappingsForFile(id);
      if (result) {
        setIsFileDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading file data after selection:', error);
    }
  };

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const formatComplexData = (field: string, value: string) => {
    if (!value) return '-';
    
    try {
      const parsedValue = JSON.parse(value);
      
      if (field === 'images') {
        if (Array.isArray(parsedValue)) {
          return (
            <div className="flex gap-1">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span>{parsedValue.length} images</span>
            </div>
          );
        }
      } else if (field === 'categories' || field === 'tags') {
        if (Array.isArray(parsedValue)) {
          return (
            <div className="flex gap-1">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>{parsedValue.length} items</span>
            </div>
          );
        }
      }
      
      if (Array.isArray(parsedValue)) {
        return `${parsedValue.length} items`;
      }
      
      if (typeof parsedValue === 'object') {
        return 'Complex data';
      }
      
      return String(parsedValue);
    } catch (e) {
      if (typeof value === 'string') {
        if (field === 'images') {
          const items = value.split(',').filter(item => item.trim());
          if (items.length > 0) {
            return (
              <div className="flex gap-1">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span>{items.length} images</span>
              </div>
            );
          }
        } else if (field === 'categories' || field === 'tags') {
          const items = value.split(',').filter(item => item.trim());
          if (items.length > 0) {
            return (
              <div className="flex gap-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>{items.length} items</span>
              </div>
            );
          }
        }
        
        if (value.length > 30) {
          return truncateText(value);
        }
      }
      return value || '-';
    }
  };
  
  const showDetailedContent = (field: string, content: string) => {
    setSelectedItem({ field, content });
  };
  
  const renderExpandedContent = (product: PreviewProduct, index: number) => {
    const complexFields = ['images', 'categories', 'tags', 'description', 'short_description'];
    const hasComplexData = Object.keys(product).some(key => 
      complexFields.includes(key) && product[key] && product[key].length > 0
    );
    
    if (!hasComplexData) return null;
    
    return (
      <TableRow className="bg-muted/30 dark:bg-gray-800">
        <TableCell colSpan={Object.values(mappings).filter(Boolean).length + 1}>
          <div className="p-2 space-y-4">
            {complexFields.map(field => {
              if (!product[field]) return null;
              
              let displayContent;
              try {
                const parsedContent = JSON.parse(product[field]);
                
                if (field === 'images') {
                  if (Array.isArray(parsedContent)) {
                    displayContent = (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {parsedContent.map((url, i) => (
                          <div key={i} className="border rounded p-1 dark:border-gray-700">
                            <div className="text-xs text-muted-foreground">Image {i+1}</div>
                            <div className="truncate text-sm">{url}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                } else if (field === 'categories' || field === 'tags') {
                  if (Array.isArray(parsedContent)) {
                    displayContent = (
                      <div className="flex flex-wrap gap-2">
                        {parsedContent.map((item, i) => (
                          <div key={i} className="bg-muted rounded-full px-2 py-1 text-xs dark:bg-gray-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    );
                  }
                } else {
                  displayContent = (
                    <div className="text-sm whitespace-pre-wrap">
                      {typeof parsedContent === 'object' 
                        ? JSON.stringify(parsedContent, null, 2) 
                        : parsedContent}
                    </div>
                  );
                }
              } catch (e) {
                if (field === 'images' && product[field].includes(',')) {
                  const urls = product[field].split(',').map(url => url.trim()).filter(Boolean);
                  displayContent = (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {urls.map((url, i) => (
                        <div key={i} className="border rounded p-1 dark:border-gray-700">
                          <div className="text-xs text-muted-foreground">Image {i+1}</div>
                          <div className="truncate text-sm">{url}</div>
                        </div>
                      ))}
                    </div>
                  );
                } else if ((field === 'categories' || field === 'tags') && product[field].includes(',')) {
                  const items = product[field].split(',').map(item => item.trim()).filter(Boolean);
                  displayContent = (
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, i) => (
                        <div key={i} className="bg-muted rounded-full px-2 py-1 text-xs dark:bg-gray-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  displayContent = (
                    <div className="text-sm whitespace-pre-wrap">
                      {product[field]}
                    </div>
                  );
                }
              }
              
              return displayContent ? (
                <div key={field} className="pb-2">
                  <div className="font-medium text-sm mb-1">{field}:</div>
                  {displayContent}
                </div>
              ) : null;
            })}
          </div>
        </TableCell>
      </TableRow>
    );
  };
  
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = Math.min(startIndex + productsPerPage, totalProducts);
  const currentProducts = products.slice(startIndex, endIndex);
  
  const handleDelayTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBatchDelayTime(isNaN(value) ? 0 : value);
  };
  
  const handleSaveProducts = async () => {
    if (!user?.id || products.length === 0) {
      toast({
        title: "Error",
        description: "No products to save or user not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    let savedCount = 0;
    let errorCount = 0;
    
    setSaveProgress(0);
    setProductSaveStatus({ saved: 0, total: products.length });
    
    try {
      if (selectedFileId) {
        try {
          const { data: updateStats } = await supabase
            .from('proceed_products')
            .update({ import_file_id: selectedFileId })
            .eq('user_id', user.id)
            .is('import_file_id', null)
            .select();
            
          const updatedCount = updateStats?.length || 0;
          if (updatedCount > 0) {
            console.log(`Updated ${updatedCount} existing products to use file ID: ${selectedFileId}`);
          }
        } catch (updateError) {
          console.error('Error updating existing products:', updateError);
        }
      }
      
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(products.length / BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, products.length);
        const currentBatch = products.slice(startIndex, endIndex);
        
        try {
          const { count } = await batchCreateProceedProducts(user.id, currentBatch, selectedFileId);
          savedCount += count;
          
          const progressPercent = Math.round((savedCount / products.length) * 100);
          setSaveProgress(progressPercent);
          setProductSaveStatus({ saved: savedCount, total: products.length });
          
          if (batchDelayTime > 0 && batchIndex < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, batchDelayTime * 1000));
          }
        } catch (batchError) {
          console.error(`Error saving batch ${batchIndex + 1}:`, batchError);
          errorCount += currentBatch.length;
        }
      }
      
      await fetchSavedProductsCount();
      
      toast({
        title: "Success",
        description: `Saved ${savedCount} products successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
      });
    } catch (error) {
      console.error('Error in save products process:', error);
      toast({
        title: "Error",
        description: "Failed to save products",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveProgress(0);
        setProductSaveStatus({ saved: 0, total: 0 });
      }, 3000);
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await deleteAllProceedProducts(user.id);
      if (result) {
        setSavedProductCount(0);
        toast({
          title: "Success",
          description: "All saved products deleted successfully",
        });
      } else {
        throw new Error("Failed to delete products");
      }
    } catch (error) {
      console.error('Error deleting all products:', error);
      toast({
        title: "Error",
        description: "Failed to delete all products",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderSaveButton = () => {
    if (isSaving) {
      return (
        <div className="w-full space-y-2">
          <Button 
            disabled={true}
            className="w-full"
            variant="secondary"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving products... ({productSaveStatus.saved}/{productSaveStatus.total})
          </Button>
          <Progress value={saveProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {productSaveStatus.saved} of {productSaveStatus.total} products saved ({saveProgress}%)
          </div>
        </div>
      );
    }
    
    return (
      <Button 
        onClick={handleSaveProducts} 
        disabled={products.length === 0 || !user?.id}
        className="w-full"
        variant="secondary"
      >
        <Save className="mr-2 h-4 w-4" />
        Save Products ({savedProductCount} saved)
      </Button>
    );
  };
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Load Products to Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium">Select Import File</label>
            <Select value={selectedFileId} onValueChange={handleFileSelect}>
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
          
          <div className="w-full sm:w-1/2 flex items-end">
            <Button 
              onClick={handleLoadProducts} 
              disabled={isLoading || !selectedFileId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Load Products
                </>
              )}
            </Button>
          </div>
        </div>
        
        {currentProducts.length > 0 && (
          <>
            <div className="rounded-md border overflow-x-auto dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    {Object.values(mappings).filter(Boolean).map((field) => (
                      <TableHead key={field} className="whitespace-nowrap">
                        {field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.map((product, index) => (
                    <React.Fragment key={index}>
                      <TableRow className="dark:hover:bg-gray-800">
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRowExpansion(index)}
                            className="h-8 w-8"
                          >
                            {expandedRows[index] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        {Object.values(mappings).filter(Boolean).map((field) => {
                          const formattedContent = formatComplexData(field, product[field]);
                          
                          return (
                            <TableCell key={field} className="max-w-[150px]">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    className="w-full text-left hover:text-primary focus:outline-none focus:text-primary transition-colors"
                                    onClick={() => showDetailedContent(field, product[field] || '')}
                                  >
                                    {typeof formattedContent === 'string' 
                                      ? formattedContent 
                                      : formattedContent || '-'}
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90vw] md:max-w-[600px]">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {selectedItem?.field}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                                    {selectedItem && (
                                      <ShowDetailedContent field={selectedItem.field} content={selectedItem.content} />
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {expandedRows[index] && renderExpandedContent(product, index)}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "opacity-50 pointer-events-none" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({length: totalPages}, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))
                  }
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "opacity-50 pointer-events-none" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {totalProducts} products
            </div>
            
            <div className="mt-6 mb-2">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/2">
                  <div className="space-y-2">
                    <Label htmlFor="batchDelayTime" className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Batch Delay Time (seconds)
                    </Label>
                    <Input
                      id="batchDelayTime"
                      type="number"
                      min="0"
                      step="0.5"
                      value={batchDelayTime || ''}
                      onChange={handleDelayTimeChange}
                      placeholder="Enter delay between batches"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set the delay time between batches to prevent API rate limiting
                    </p>
                  </div>
                </div>
                
                <div className="w-full sm:w-1/2">
                  {renderSaveButton()}
                </div>
              </div>
            </div>
            
            {savedProductCount > 0 && (
              <div className="mt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      disabled={isDeleting || !user?.id}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete All Saved Products ({savedProductCount})
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all {savedProductCount} saved products.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllProducts}>
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            
            <ImportButton 
              productCount={totalProducts} 
              isLoading={isLoading} 
              delayTime={batchDelayTime}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ShowDetailedContent({ field, content }: { field: string, content: string }) {
  if (!content) return <p>No content available</p>;
  
  try {
    const parsedContent = JSON.parse(content);
    
    if (field === 'images') {
      if (Array.isArray(parsedContent)) {
        return (
          <div className="space-y-2">
            {parsedContent.map((url, i) => (
              <div key={i} className="border p-2 rounded dark:border-gray-700">
                <p className="text-sm font-medium mb-1">Image {i+1}:</p>
                <p className="text-sm break-all">{url}</p>
              </div>
            ))}
          </div>
        );
      }
    } else if (field === 'categories' || field === 'tags') {
      if (Array.isArray(parsedContent)) {
        return (
          <div className="flex flex-wrap gap-2">
            {parsedContent.map((item, i) => (
              <div key={i} className="bg-muted rounded-full px-3 py-1 text-sm dark:bg-gray-700">
                {item}
              </div>
            ))}
          </div>
        );
      }
    }
    
    return (
      <pre className="bg-muted p-4 rounded-md overflow-auto text-sm dark:bg-gray-800">
        {JSON.stringify(parsedContent, null, 2)}
      </pre>
    );
  } catch (e) {
    if (field === 'images' && content.includes(',')) {
      const urls = content.split(',').map(url => url.trim()).filter(Boolean);
      return (
        <div className="space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="border p-2 rounded dark:border-gray-700">
              <p className="text-sm font-medium mb-1">Image {i+1}:</p>
              <p className="text-sm break-all">{url}</p>
            </div>
          ))}
        </div>
      );
    } else if ((field === 'categories' || field === 'tags') && content.includes(',')) {
      const items = content.split(',').map(item => item.trim()).filter(Boolean);
      return (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <div key={i} className="bg-muted rounded-full px-3 py-1 text-sm dark:bg-gray-700">
              {item}
            </div>
          ))}
        </div>
      );
    } else if (field === 'description' || field === 'short_description') {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
    
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }
}
