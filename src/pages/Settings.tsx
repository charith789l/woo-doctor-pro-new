import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Download, ExternalLink, Key, Plus, RefreshCw, Store, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StoreCard, StoreCardSkeleton } from "@/components/settings/StoreCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  store_name: z.string().min(1, { message: "Store name is required" }),
  woocommerce_url: z.string().url({ message: "Please enter a valid URL" }),
  consumer_key: z.string().min(1, { message: "Consumer key is required" }),
  consumer_secret: z.string().min(1, { message: "Consumer secret is required" }),
});

type FormValues = z.infer<typeof formSchema>;

type WooCommerceSettings = {
  id: string;
  user_id: string;
  store_name: string;
  woocommerce_url: string;
  consumer_key: string;
  consumer_secret: string;
  created_at: string;
  updated_at: string;
  is_connected: boolean;
  last_connection_check: string;
};

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [storeToConnect, setStoreToConnect] = useState<string | null>(null);
  const [currentConnectedStore, setCurrentConnectedStore] = useState<string | null>(null);

  const { data: stores, refetch, isLoading: isStoresLoading } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('woocommerce_settings')
        .select('*')
        .order('store_name', { ascending: true });
      
      if (error) throw error;
      return data as WooCommerceSettings[];
    },
  });

  useEffect(() => {
    if (stores) {
      const connected = stores.find(store => store.is_connected);
      setCurrentConnectedStore(connected?.id || null);
    }
  }, [stores]);

  const addStoreForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      store_name: "",
      woocommerce_url: "",
      consumer_key: "",
      consumer_secret: "",
    },
  });

  const onAddStore = async (values: FormValues) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('woocommerce_settings')
        .insert({
          user_id: user.id,
          store_name: values.store_name,
          woocommerce_url: values.woocommerce_url,
          consumer_key: values.consumer_key,
          consumer_secret: values.consumer_secret,
        });

      if (error) {
        if (error.message.includes('Maximum number of stores')) {
          throw new Error('You have reached the maximum limit of 10 stores.');
        }
        throw error;
      }

      await refetch();
      setIsDialogOpen(false);
      addStoreForm.reset();
      toast({
        title: "Store added",
        description: "Your WooCommerce store has been added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding store:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = async (storeId: string, isConnecting: boolean): Promise<boolean> => {
    if (!isConnecting) {
      return true;
    }
    
    if (isConnecting && currentConnectedStore && currentConnectedStore !== storeId) {
      setStoreToConnect(storeId);
      setIsConfirmDialogOpen(true);
      return false;
    }
    
    return true;
  };

  const handleConfirmedConnectionChange = async () => {
    if (!storeToConnect || !currentConnectedStore) return;
    
    setIsLoading(true);
    try {
      const { error: disconnectError } = await supabase
        .from('woocommerce_settings')
        .update({
          is_connected: false,
          last_connection_check: new Date().toISOString()
        })
        .eq('id', currentConnectedStore);

      if (disconnectError) throw disconnectError;

      const { error: connectError } = await supabase
        .from('woocommerce_settings')
        .update({
          is_connected: true,
          last_connection_check: new Date().toISOString()
        })
        .eq('id', storeToConnect);

      if (connectError) throw connectError;

      toast({
        title: "Store connection changed",
        description: "Successfully switched the active store connection.",
      });
      
      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch store connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
      setStoreToConnect(null);
    }
  };

  useEffect(() => {
    document.title = "Settings | Woo Doctor";
  }, []);

  const renderStorePlaceholders = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <StoreCardSkeleton key={`skeleton-${index}`} />
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Store Settings</h1>
          <p className="text-muted-foreground">
            Manage your WooCommerce store connections and integrations.
          </p>
        </div>

        {!stores?.length && !isStoresLoading && (
          <Alert variant="destructive" className="bg-destructive/10 dark:bg-destructive/20 border-destructive/30">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive font-semibold">Store Not Connected</AlertTitle>
            <AlertDescription className="text-destructive/90">
              Please add your WooCommerce store credentials below to start using the application.
              Without these credentials, you won't be able to sync or manage your products.
            </AlertDescription>
          </Alert>
        )}

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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Connected Stores</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ml-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Store</DialogTitle>
                  <DialogDescription>
                    Add your WooCommerce store details below. You can add up to 10 stores.
                  </DialogDescription>
                </DialogHeader>

                <Form {...addStoreForm}>
                  <form onSubmit={addStoreForm.handleSubmit(onAddStore)} className="space-y-4 pt-2">
                    <FormField
                      control={addStoreForm.control}
                      name="store_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My WooCommerce Store" {...field} />
                          </FormControl>
                          <FormDescription>
                            A name to identify your store
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addStoreForm.control}
                      name="woocommerce_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://your-store.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The URL of your WooCommerce store
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addStoreForm.control}
                      name="consumer_key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consumer Key</FormLabel>
                          <FormControl>
                            <Input placeholder="ck_xxxxx" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your WooCommerce REST API consumer key
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addStoreForm.control}
                      name="consumer_secret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consumer Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="cs_xxxxx" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your WooCommerce REST API consumer secret
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="pt-4">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Store"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isStoresLoading ? (
              renderStorePlaceholders()
            ) : stores?.length ? (
              stores.map((store) => (
                <StoreCard
                  key={store.id}
                  id={store.id}
                  storeName={store.store_name}
                  storeUrl={store.woocommerce_url}
                  consumerKey={store.consumer_key}
                  isConnected={store.is_connected}
                  lastConnectionCheck={store.last_connection_check}
                  onRefresh={refetch}
                  onConnectionChange={handleConnectionChange}
                />
              ))
            ) : (
              <Card className="col-span-full border-dashed border-2 bg-muted/40">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Store className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stores connected</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Connect your WooCommerce store to start managing your products, orders, and more.
                  </p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Store
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="pt-6">
          <Separator className="mb-8" />
          <h2 className="text-xl font-semibold mb-6">WooCommerce Connection Guide</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Step 1: Install Legacy REST API Plugin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You need to download and install this plugin to enable REST API functionality in WooCommerce.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <a 
                  href="https://github.com/woocommerce/woocommerce-legacy-rest-api/releases/download/1.0.5/woocommerce-legacy-rest-api.zip" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary flex items-center gap-1"
                >
                  Download here <ExternalLink className="h-3 w-3" />
                </a>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Step 2: Enable REST API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ensure the WooCommerce REST API is enabled in your WordPress store. 
                  Go to WooCommerce → Settings → Advanced → REST API.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <a 
                  href="https://woocommerce.com/document/woocommerce-rest-api/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary flex items-center gap-1"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Step 3: Create API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create a new API key with Read/Write permissions for all resources. 
                  Save the Consumer Key and Consumer Secret generated.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <a 
                  href="https://woocommerce.com/document/woocommerce-rest-api/authentication/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary flex items-center gap-1"
                >
                  API Documentation <ExternalLink className="h-3 w-3" />
                </a>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Step 4: Test Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  After adding your store, test the connection to verify that the API 
                  credentials are working correctly and Woo Doctor can access your store.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Secure and encrypted connection</span>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Troubleshooting</CardTitle>
                <CardDescription>
                  Common issues and how to resolve them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Connection Errors</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure your site is publicly accessible and not blocked by a firewall. 
                      Check that your API keys have the correct permissions.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Data Not Syncing</h4>
                    <p className="text-sm text-muted-foreground">
                      Try reconnecting the store by clicking "Disconnect" then "Connect" again.
                      Verify that your WooCommerce version is 3.5 or higher.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Permissions Issues</h4>
                    <p className="text-sm text-muted-foreground">
                      Create new API keys with "Read/Write" access to all resources if you 
                      encounter permission errors during operations.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Refresh All Connections
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
