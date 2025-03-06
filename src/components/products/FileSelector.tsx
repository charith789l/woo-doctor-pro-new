
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedFile {
  id: string;
  filename: string;
  content: string;
  file_type: string;
  created_at: string;
}

interface FileSelectorProps {
  onFileSelect: (fileId: string, content: string, type: 'csv' | 'xml') => void;
}

export function FileSelector({ onFileSelect }: FileSelectorProps) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Set auth ready state when user data is loaded
  useEffect(() => {
    if (user !== null) {
      setIsAuthReady(true);
    }
  }, [user]);

  // Query for saved files with improved configuration
  const { 
    data: savedFiles, 
    isLoading: isFetchingFiles,
    error: filesError,
    refetch: refetchFiles
  } = useQuery({
    queryKey: ['saved-files', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log("Fetching saved files for user:", user.id);
      
      try {
        const { data, error } = await supabase
          .from('import_files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log("Fetched files count:", data?.length || 0);
        return data as SavedFile[];
      } catch (error) {
        console.error('Error fetching saved files:', error);
        throw error;
      }
    },
    enabled: !!user?.id && isAuthReady,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes (replaces cacheTime)
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 30000), // Exponential backoff
  });

  // Log any errors with file fetching
  useEffect(() => {
    if (filesError) {
      console.error('Error in files query:', filesError);
      toast({
        title: "Error",
        description: "Failed to fetch saved files. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, [filesError, toast]);

  const handleSavedFileSelect = (selectedFileId: string) => {
    const savedFile = savedFiles?.find(file => file.id === selectedFileId);
    if (savedFile) {
      onFileSelect(
        savedFile.id, 
        savedFile.content, 
        savedFile.file_type as 'csv' | 'xml'
      );
      
      toast({
        title: "File Selected",
        description: `Selected file: ${savedFile.filename}`,
      });
    }
  };

  // Not showing if user is not authenticated yet
  if (!isAuthReady || !user?.id) {
    return null;
  }
  
  // Show loading skeleton
  if (isFetchingFiles) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Loading saved files...
        </label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  // Show error state
  if (filesError) {
    return (
      <div className="text-sm text-red-500">
        Failed to load saved files. Please refresh the page.
      </div>
    );
  }
  
  // Show dropdown if files exist
  if (savedFiles && savedFiles.length > 0) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Select a previously uploaded file
        </label>
        <Select onValueChange={handleSavedFileSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a saved file" />
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
    );
  }
  
  // Show message if no files
  return (
    <div className="text-sm text-muted-foreground mb-2">
      No previously uploaded files found. Upload a new file to get started.
    </div>
  );
}
