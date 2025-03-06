
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportResponse {
  successCount: number;
  failCount: number;
  failedImports?: Array<{
    sku: string;
    error: string;
  }>;
  remaining: number;
}

export const useProcessChunk = (fileId: string, storeId: string, onError: () => void) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error('Please select a store before importing products.');
      }

      console.log('Attempting to process chunk...', { fileId, storeId });
      const response = await supabase.functions.invoke<ImportResponse>('process-product-import', {
        body: { 
          fileId,
          storeId
        },
      });

      if (!response.data) {
        throw new Error('Failed to process chunk');
      }

      // Show success/failure summary
      if (response.data.successCount > 0 || response.data.failCount > 0) {
        const description = [
          response.data.successCount > 0 ? `${response.data.successCount} products imported successfully.` : '',
          response.data.failCount > 0 ? `${response.data.failCount} products failed.` : '',
          response.data.remaining > 0 ? `${response.data.remaining} products remaining.` : ''
        ].filter(Boolean).join(' ');

        toast({
          title: response.data.successCount > 0 ? "Import Progress" : "Import Issues",
          description,
          variant: response.data.failCount > 0 ? "destructive" : "default",
        });

        // Show specific error messages for failed imports
        if (response.data.failedImports?.length) {
          response.data.failedImports.forEach(fail => {
            toast({
              title: `Import Failed: ${fail.sku}`,
              description: fail.error,
              variant: "destructive",
            });
          });
        }
      }

      return response.data;
    },
    onError: (error: Error) => {
      console.error('Error processing chunk:', error);
      
      // Extract error details if available
      let errorMessage = error.message;
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use original error message if not JSON
      }

      toast({
        title: "Store Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError();
    },
  });
};
