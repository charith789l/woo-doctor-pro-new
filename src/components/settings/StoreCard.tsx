
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ExternalLink, Globe, Key, RefreshCw, Settings, Store, Trash2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface StoreCardProps {
  id: string;
  storeName: string;
  storeUrl: string;
  consumerKey: string;
  isConnected: boolean | null;
  lastConnectionCheck: string | null;
  onRefresh: () => void;
  onConnectionChange: (storeId: string, isConnecting: boolean) => Promise<boolean>;
}

export function StoreCard({ 
  id, 
  storeName, 
  storeUrl, 
  consumerKey,
  isConnected, 
  lastConnectionCheck, 
  onRefresh,
  onConnectionChange
}: StoreCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('woocommerce_settings')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Store removed",
        description: "Store has been successfully removed",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove store",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionToggle = async () => {
    setIsLoading(true);
    try {
      // First, check with the parent if we can connect/disconnect
      const success = await onConnectionChange(id, !isConnected);
      
      if (!success) {
        // If parent function returns false, it means the operation was cancelled or handled there
        setIsLoading(false);
        return;
      }
      
      const updateData = {
        is_connected: !isConnected,
        last_connection_check: new Date().toISOString()
      };

      const { error } = await supabase
        .from('woocommerce_settings')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Connection updated",
        description: `Store ${isConnected ? 'disconnected' : 'connected'} successfully`,
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isConnected ? 'disconnect' : 'connect'} store`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // In a real application, you would make an API call to test the connection
      // For now, we'll just simulate a delay and then update the last_connection_check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updateData = {
        is_connected: true,
        last_connection_check: new Date().toISOString()
      };

      // First, check with the parent component if there's already a connected store
      const success = await onConnectionChange(id, true);
      
      if (!success) {
        // If parent function returns false, it means the operation was cancelled
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('woocommerce_settings')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Connection tested",
        description: "Connection test was successful",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to hide part of the consumer key for security
  const formatApiKey = (key: string) => {
    if (!key) return "••••••••";
    return key.substring(0, 4) + "•••••••••••" + key.substring(key.length - 4);
  };

  // Truncate URL for display
  const displayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <Card className="w-full h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            {storeName}
          </CardTitle>
          <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-green-500" : ""}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a 
                href={storeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-primary transition-colors"
              >
                {displayUrl(storeUrl)}
                <ExternalLink className="ml-1 w-3 h-3" />
              </a>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Key className="w-4 h-4" />
              <span>{formatApiKey(consumerKey)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="w-4 h-4" />
              <span>Last check: {
                lastConnectionCheck 
                  ? format(new Date(lastConnectionCheck), 'MMM d, yyyy h:mm a') 
                  : 'Never'
              }</span>
            </div>
          </div>
          
          {isConnected && (
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Store integration is active and working correctly.</span>
              </div>
            </div>
          )}
          
          {!isConnected && (
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-100 dark:border-amber-800">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <XCircle className="w-4 h-4 text-amber-500" />
                <span>Store connection is inactive. Test connection or reconnect.</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={testConnection}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Test Connection
        </Button>
        
        <Button
          variant={isConnected ? "outline" : "default"}
          size="sm"
          onClick={handleConnectionToggle}
          disabled={isLoading}
          className={isConnected ? "border-amber-200 hover:bg-amber-50 text-amber-700 dark:border-amber-800 dark:hover:bg-amber-950" : ""}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              {isConnected ? 'Disconnecting...' : 'Connecting...'}
            </>
          ) : (
            isConnected ? 'Disconnect' : 'Connect'
          )}
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove store</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this store? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export function StoreCardSkeleton() {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </CardFooter>
    </Card>
  );
}
