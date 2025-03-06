import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MappingCardProps, PreviewProduct } from './types/import-types';
import { detectFields, generatePreview, normalizeProductType } from './utils/importUtils';
import { MappingForm } from './MappingForm';
import { MappingPreview } from './MappingPreview';
import { LoadProductsSection } from './LoadProductsSection';

export function ProductImportMapping({
  fileType,
  fileContent,
  fileId,
  selectedStoreId,
  onMappingSaved
}: MappingCardProps) {
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingFields, setIsFetchingFields] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<PreviewProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [woocommerceFields, setWoocommerceFields] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const fetchWooCommerceFields = async () => {
    try {
      if (!selectedStoreId) {
        throw new Error('No store selected');
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      setIsFetchingFields(true);
      console.log('Fetching WooCommerce fields for store:', selectedStoreId);

      const startTime = performance.now();
      const { data, error } = await supabase.functions.invoke('fetch-woocommerce-fields', {
        body: { 
          storeId: selectedStoreId,
          userId: user.id
        },
      });
      const endTime = performance.now();
      console.log(`Function call took ${endTime - startTime}ms`);

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      if (!data || !data.fields) {
        throw new Error('Invalid response from server');
      }

      console.log('Successfully received fields:', data.fields.length);

      toast({
        title: "Success",
        description: "WooCommerce fields fetched successfully",
      });

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('woocommerce_product_fields')
        .select('field_name')
        .eq('user_id', user.id);

      if (fieldsError) throw fieldsError;

      const fields = fieldsData.map(f => f.field_name);
      setWoocommerceFields(fields);
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching WooCommerce fields:', error);
      
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Retrying",
          description: `Failed to fetch fields, retrying (${retryCount + 1}/${maxRetries})...`,
          variant: "default",
        });
        setTimeout(() => fetchWooCommerceFields(), 2000);
      } else {
        toast({
          title: "Error",
          description: `Failed to fetch WooCommerce fields after ${maxRetries} attempts: ${error.message}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsFetchingFields(false);
    }
  };

  const handleAutoMap = () => {
    const newMappings = { ...mappings };
    
    detectedFields.forEach(fileField => {
      const fileFieldLower = fileField.toLowerCase().replace(/[_-]/g, '');
      
      if (fileFieldLower === 'type' || fileFieldLower === 'producttype') {
        newMappings[fileField] = 'type';
        return;
      }
      
      const bestMatch = woocommerceFields.reduce((best, wooField) => {
        const wooFieldLower = wooField.toLowerCase().replace(/[_-]/g, '');
        
        if (fileFieldLower === wooFieldLower) {
          return wooField;
        }
        
        if (!best && (fileFieldLower.includes(wooFieldLower) || wooFieldLower.includes(fileFieldLower))) {
          return wooField;
        }
        
        return best;
      }, '');
      
      if (bestMatch) {
        newMappings[fileField] = bestMatch;
      }
    });
    
    setMappings(newMappings);
    toast({
      title: "Auto-mapping complete",
      description: "Fields have been automatically mapped where possible",
    });
  };

  const handleSaveMappings = async () => {
    try {
      setIsSaving(true);
      await supabase
        .from('import_file_mappings')
        .delete()
        .eq('import_file_id', fileId);

      const mappingsToInsert = Object.entries(mappings).map(([fileField, wooField]) => ({
        import_file_id: fileId,
        file_field_name: fileField,
        woocommerce_field: wooField,
        user_id: user?.id,
      }));

      const { error } = await supabase
        .from('import_file_mappings')
        .insert(mappingsToInsert);

      if (error) throw error;

      let finalMappings = { ...mappings };
      if (!Object.values(finalMappings).includes('type')) {
        const possibleTypeField = detectedFields.find(field => 
          field.toLowerCase().includes('type') || field.toLowerCase().includes('product_type')
        );
        
        if (possibleTypeField) {
          finalMappings[possibleTypeField] = 'type';
        }
      }

      const { products, totalProducts: total } = generatePreview(fileType, fileContent, finalMappings);
      setPreviewProducts(products);
      setTotalProducts(total);
      
      toast({
        title: "Success",
        description: "Field mappings saved successfully",
      });
      
      onMappingSaved();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: "Error",
        description: "Failed to save field mappings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: fieldsData } = await supabase
          .from('woocommerce_product_fields')
          .select('field_name')
          .eq('user_id', user?.id);

        const fields = fieldsData?.map(f => f.field_name) || [
          'name', 'description', 'short_description', 'regular_price',
          'sale_price', 'sku', 'stock_quantity', 'categories',
          'tags', 'status', 'type', 'virtual', 'downloadable', 'images'
        ];
        setWoocommerceFields(fields);

        const detected = detectFields(fileContent, fileType);
        setDetectedFields(detected);

        const { data: mappingsData } = await supabase
          .from('import_file_mappings')
          .select('file_field_name, woocommerce_field')
          .eq('import_file_id', fileId);

        if (mappingsData) {
          const loadedMappings: { [key: string]: string } = {};
          mappingsData.forEach(mapping => {
            loadedMappings[mapping.file_field_name] = mapping.woocommerce_field;
          });
          setMappings(loadedMappings);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [fileContent, fileType, fileId, user?.id]);

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Field Mapping - {fileType.toUpperCase()}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWooCommerceFields}
              disabled={isFetchingFields || !selectedStoreId}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingFields ? 'animate-spin' : ''}`} />
              {isFetchingFields ? 'Fetching Fields...' : 'Fetch WC Fields'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MappingForm
            mappingState={{ detectedFields, mappings, woocommerceFields }}
            onUpdateMappings={setMappings}
            onAutoMap={handleAutoMap}
            onSaveMappings={handleSaveMappings}
            isSaving={isSaving}
          />

          {previewProducts.length > 0 && (
            <MappingPreview
              previewProducts={previewProducts}
              mappings={mappings}
              totalProducts={totalProducts}
            />
          )}
        </CardContent>
      </Card>

      {previewProducts.length > 0 && (
        <LoadProductsSection fileId={fileId} />
      )}
    </div>
  );
}
