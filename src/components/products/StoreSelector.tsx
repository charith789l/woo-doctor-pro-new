import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Store, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoreSelectorProps {
  onStoreSelect: (storeId: string) => void;
  selectedStoreId?: string;
}

interface WooCommerceStore {
  id: string;
  store_name: string;
  is_connected: boolean;
  last_connection_check: string | null;
}

export function StoreSelector({ onStoreSelect, selectedStoreId }: StoreSelectorProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [storeToConnect, setStoreToConnect] = useState<string | null>(null);
  const [currentConnectedStore, setCurrentConnectedStore] = useState<string | null>(null);

  const storesQuery = useQuery({
    queryKey: ['woocommerce-stores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('woocommerce_settings')
        .select('id, store_name, is_connected, last_connection_check')
        .eq('user_id', user.id)
        .order('store_name', { ascending: true });

      if (error) throw error;
      return (data || []) as WooCommerceStore[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    // Find the connected store
    if (storesQuery.data?.length) {
      const connectedStore = storesQuery.data.find(store => store.is_connected);
      setCurrentConnectedStore(connectedStore?.id || null);
      
      // Auto-select the connected store if available and no store is currently selected
      if (connectedStore && !selectedStoreId) {
        onStoreSelect(connectedStore.id);
      }
      // If no connected store but we have stores, select the first one
      else if (!selectedStoreId && storesQuery.data.length > 0) {
        onStoreSelect(storesQuery.data[0].id);
      }
    }
  }, [storesQuery.data, selectedStoreId, onStoreSelect]);

  const handleStoreChange = (storeId: string) => {
    // If selecting the same store, do nothing
    if (storeId === selectedStoreId) return;
    
    const newStore = storesQuery.data?.find(store => store.id === storeId);
    const currentStore = storesQuery.data?.find(store => store.id === selectedStoreId);
    
    // If the current selected store is connected and we're selecting a different store
    if (currentStore?.is_connected && storeId !== selectedStoreId) {
      setStoreToConnect(storeId);
      setIsConfirmDialogOpen(true);
      return;
    }
    
    // Otherwise just select the store
    onStoreSelect(storeId);
    toast({
      title: "Store Changed",
      description: `You're now viewing ${newStore?.store_name || 'a different store'}`,
    });
  };

  const handleStoreConnection = async (storeId: string) => {
    setIsLoading(true);
    try {
      // First disconnect current connected store if any
      if (currentConnectedStore) {
        const { error: disconnectError } = await supabase
          .from('woocommerce_settings')
          .update({
            is_connected: false,
            last_connection_check: new Date().toISOString()
          })
          .eq('id', currentConnectedStore);

        if (disconnectError) throw disconnectError;
      }

      // Then connect the new store
      const { error: connectError } = await supabase
        .from('woocommerce_settings')
        .update({
          is_connected: true,
          last_connection_check: new Date().toISOString()
        })
        .eq('id', storeId);

      if (connectError) throw connectError;

      // Select the newly connected store
      onStoreSelect(storeId);
      setCurrentConnectedStore(storeId);
      
      const newStore = storesQuery.data?.find(store => store.id === storeId);
      toast({
        title: "Store Connected",
        description: `Successfully connected to ${newStore?.store_name || 'the selected store'}`,
      });
      
      // Refresh store data
      storesQuery.refetch();
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to store",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
      setStoreToConnect(null);
    }
  };

  // Handle confirmed connection change (disconnect current + connect new)
  const handleConfirmedConnectionChange = async () => {
    if (!storeToConnect) return;
    
    await handleStoreConnection(storeToConnect);
  };

  if (storesQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const stores = storesQuery.data || [];

  if (!stores.length) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Connected Stores</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>You need to connect at least one WooCommerce store before importing products.</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
          >
            Go to Settings
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Find the currently selected store
  const selectedStore = stores.find(store => store.id === selectedStoreId);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        <Store className="h-4 w-4" /> Active Store
      </label>
      
      {/* Confirmation Dialog for Store Connection Change */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Active Store Connection</DialogTitle>
            <DialogDescription>
              You already have an active store connection. Connecting a new store will disconnect the current one.
              Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmedConnectionChange}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Switching...
                </>
              ) : "Switch Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Select
        value={selectedStoreId}
        onValueChange={handleStoreChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedStore && (
              <div className="flex items-center gap-2">
                {selectedStore.store_name}
                {selectedStore.is_connected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-1">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ml-1">
                    <XCircle className="w-3 h-3 mr-1 text-red-500" />
                    Disconnected
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem 
              key={store.id} 
              value={store.id}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span>{store.store_name}</span>
                {store.is_connected ? (
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 py-0 text-xs"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent SelectItem from being triggered
                      setStoreToConnect(store.id);
                      setIsConfirmDialogOpen(true);
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
