
import React, { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UploadCloud, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreSelector } from "./StoreSelector";
import { ProductImportMapping } from "./ProductImportMapping";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface SavedFile {
  id: string;
  filename: string;
  content: string;
  file_type: string;
  created_at: string;
}

export function ProductImporter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileType, setFileType] = useState<'csv' | 'xml' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [fileId, setFileId] = useState<string>("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  // Debug logging for saved files
  useEffect(() => {
    console.log("Auth ready state:", isAuthReady);
    console.log("Current user ID:", user?.id);
    console.log("Saved files state:", savedFiles);
  }, [isAuthReady, user, savedFiles]);

  // Function to simulate smooth progress for better UX
  const animateProgress = useCallback((start: number, end: number, duration: number) => {
    const startTime = Date.now();
    const interval = 16; // ~60fps
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Ease in-out
      const currentProgress = start + (end - start) * easedProgress;
      
      setUploadProgress(currentProgress);
      
      if (progress < 1) {
        setTimeout(updateProgress, interval);
      }
    };
    
    updateProgress();
  }, []);

  const handleSavedFileSelect = async (selectedFileId: string) => {
    const savedFile = savedFiles?.find(file => file.id === selectedFileId);
    if (savedFile) {
      setFileContent(savedFile.content);
      setFileId(savedFile.id);
      setFileType(savedFile.file_type as 'csv' | 'xml');
      
      toast({
        title: "File Selected",
        description: `Selected file: ${savedFile.filename}`,
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xml') {
        setSelectedFile(file);
        setFileType(fileExtension as 'csv' | 'xml');
        setUploadProgress(0); // Reset progress when new file is selected
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or XML file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !user?.id || !selectedStoreId) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Start with quick jump to 5% to show user something is happening
      animateProgress(0, 5, 300);
      
      const reader = new FileReader();
      
      // Add progress tracking for file reading (5-50%)
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 45;
          setUploadProgress(5 + percentComplete);
        }
      };
      
      reader.onload = async (e) => {
        // Once file is read, start smooth animation to 60%
        animateProgress(50, 60, 500);
        
        const content = e.target?.result as string;
        
        // Start uploading to Supabase, animate progress to 90%
        animateProgress(60, 90, 1000);
        
        const { data, error } = await supabase
          .from('import_files')
          .insert({
            filename: selectedFile.name,
            content: content,
            file_type: fileType as string,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;

        // If upload successful, animate to 100%
        animateProgress(90, 100, 500);

        // Add null check here to fix TypeScript error
        if (data) {
          setFileContent(content);
          setFileId(data.id);

          toast({
            title: "Success",
            description: "File uploaded successfully",
          });

          // Refresh the files query to show the newly uploaded file
          await refetchFiles();
        }
      };

      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      setUploadProgress(0); // Reset progress on error
    } finally {
      setTimeout(() => {
        setIsUploading(false);
      }, 500); // Keep the 100% progress visible briefly
    }
  }, [selectedFile, user?.id, selectedStoreId, fileType, toast, refetchFiles, animateProgress]);

  const handleMappingSaved = useCallback(() => {
    toast({
      title: "Success",
      description: "Mappings saved successfully",
    });
  }, [toast]);

  // Render saved files selector or loading state
  const renderSavedFilesSelector = () => {
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
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Products</CardTitle>
          <CardDescription>
            Upload a CSV or XML file to import products into your WooCommerce store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreSelect={setSelectedStoreId}
          />
          
          {renderSavedFilesSelector()}
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById('fileInput')?.click()}
              className="flex items-center gap-2"
              disabled={!selectedStoreId}
            >
              <UploadCloud className="h-4 w-4" />
              Select New File
            </Button>
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xml"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Selected file: {selectedFile.name}
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <>
              {/* Upload progress bar */}
              {(isUploading || uploadProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Uploading file...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 w-full" />
                </div>
              )}
              
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedStoreId}
                className="w-full flex items-center gap-2"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Upload and Continue'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {fileContent && fileType && fileId && (
        <ProductImportMapping
          fileType={fileType}
          fileContent={fileContent}
          fileId={fileId}
          selectedStoreId={selectedStoreId}
          onMappingSaved={handleMappingSaved}
        />
      )}
    </div>
  );
}
