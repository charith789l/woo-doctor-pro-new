import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RefreshCw, Info, Image as ImageIcon, X, StarOff, Star, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateProductImages } from "@/services/woocommerce-service";

interface Product {
  id: number;
  name: string;
  short_description?: string;
  description?: string;
  price?: string | number;
  stock_status: string;
  stock_quantity: number | null;
  on_sale: boolean;
  images?: { src: string; id?: number; position?: number; }[];
  permalink?: string;
  regular_price?: string;
  sale_price?: string;
  categories?: { id: number; name: string }[];
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  sku?: string;
  manage_stock?: boolean;
  backorders?: string;
  backorders_allowed?: boolean;
  sold_individually?: boolean;
  tax_status?: string;
  tax_class?: string;
  shipping_class?: string;
  shipping_class_id?: number;
  reviews_allowed?: boolean;
  average_rating?: string;
  rating_count?: number;
  related_ids?: number[];
  upsell_ids?: number[];
  cross_sell_ids?: number[];
  parent_id?: number;
  purchase_note?: string;
  tags?: { id: number; name: string }[];
  attributes?: {
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }[];
  default_attributes?: {
    id: number;
    name: string;
    option: string;
  }[];
  meta_data?: {
    id: number;
    key: string;
    value: string;
  }[];
  status?: string;
  featured?: boolean;
  catalog_visibility?: string;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
}

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  regular_price: z.string().min(1, "Regular price is required"),
  sale_price: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]),
  stock_quantity: z.number().min(0, "Stock quantity must be 0 or greater"),
  on_sale: z.boolean(),
  images: z.array(z.object({
    id: z.number().optional(),
    src: z.string().url("Please enter a valid image URL"),
    name: z.string().optional(),
    alt: z.string().optional(),
    position: z.number().optional(),
  })).optional(),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.string(),
    width: z.string(),
    height: z.string()
  }).optional(),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string()
  })).optional(),
  sku: z.string().optional(),
  manage_stock: z.boolean().optional(),
  backorders: z.enum(["no", "notify", "yes"]).optional(),
  sold_individually: z.boolean().optional(),
  tax_status: z.enum(["taxable", "shipping", "none"]).optional(),
  tax_class: z.string().optional(),
  shipping_class: z.string().optional(),
  reviews_allowed: z.boolean().optional(),
  purchase_note: z.string().optional(),
  featured: z.boolean().optional(),
  catalog_visibility: z.enum(["visible", "catalog", "search", "hidden"]).optional(),
  status: z.enum(["draft", "pending", "private", "publish"]).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  date_on_sale_from: z.string().optional(),
  date_on_sale_to: z.string().optional(),
  featured_image_id: z.number().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductEditDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormValues) => Promise<void>;
  woocommerceSettings?: any;
}

export const ProductEditDialog = ({ product, open, onOpenChange, onSave, woocommerceSettings }: ProductEditDialogProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      regular_price: "",
      sale_price: "",
      short_description: "",
      description: "",
      stock_status: "instock",
      stock_quantity: 0,
      on_sale: false,
      images: [],
      weight: "",
      dimensions: {
        length: "",
        width: "",
        height: ""
      },
      categories: [],
      sku: "",
      manage_stock: true,
      backorders: "no",
      sold_individually: false,
      tax_status: "taxable",
      tax_class: "",
      shipping_class: "",
      reviews_allowed: true,
      purchase_note: "",
      featured: false,
      catalog_visibility: "visible",
      status: "publish",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      date_on_sale_from: "",
      date_on_sale_to: "",
      featured_image_id: 0,
    }
  });

  useEffect(() => {
    if (product) {
      let featuredImageId = 0;
      if (product.images && product.images.length > 0) {
        const featuredImage = product.images.find(img => img.position === 0);
        featuredImageId = featuredImage ? product.images.indexOf(featuredImage) : 0;
      }

      form.reset({
        name: product.name,
        regular_price: product.regular_price || String(product.price) || "",
        sale_price: product.sale_price || "",
        short_description: product.short_description || "",
        description: product.description || "",
        stock_status: product.stock_status as "instock" | "outofstock" | "onbackorder",
        stock_quantity: product.stock_quantity || 0,
        on_sale: product.on_sale,
        images: product.images || [],
        weight: product.weight || "",
        dimensions: product.dimensions || {
          length: "",
          width: "",
          height: ""
        },
        categories: product.categories || [],
        sku: product.sku || "",
        manage_stock: product.manage_stock || true,
        backorders: (product.backorders as "no" | "notify" | "yes") || "no",
        sold_individually: product.sold_individually || false,
        tax_status: (product.tax_status as "taxable" | "shipping" | "none") || "taxable",
        tax_class: product.tax_class || "",
        shipping_class: product.shipping_class || "",
        reviews_allowed: product.reviews_allowed || true,
        purchase_note: product.purchase_note || "",
        featured: product.featured || false,
        catalog_visibility: (product.catalog_visibility as "visible" | "catalog" | "search" | "hidden") || "visible",
        status: (product.status as "draft" | "pending" | "private" | "publish") || "publish",
        meta_title: product.meta_data?.find(meta => meta.key === "_yoast_wpseo_title")?.value || "",
        meta_description: product.meta_data?.find(meta => meta.key === "_yoast_wpseo_metadesc")?.value || "",
        meta_keywords: product.meta_data?.find(meta => meta.key === "_yoast_wpseo_metakeywords")?.value || "",
        date_on_sale_from: product.date_on_sale_from || "",
        date_on_sale_to: product.date_on_sale_to || "",
        featured_image_id: featuredImageId,
      });
    }
  }, [product, form]);

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await onSave(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleImageUpdate = async (updatedImages: any[]) => {
    if (!product || !woocommerceSettings) {
      toast({
        title: "Error",
        description: "Product or WooCommerce settings not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingImages(true);
      await updateProductImages(product.id, updatedImages, woocommerceSettings);
      toast({
        title: "Success",
        description: "Product images updated successfully",
      });
      form.setValue('images', updatedImages);
    } catch (error) {
      console.error('Error updating product images:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product images",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    const currentImages = form.getValues('images') || [];
    const newImage = {
      src: newImageUrl,
      name: newImageUrl.split('/').pop() || 'product-image',
      alt: form.getValues('name') || 'Product image',
      position: currentImages.length,
    };
    
    const updatedImages = [...currentImages, newImage];
    
    form.setValue('images', updatedImages);
    await handleImageUpdate(updatedImages);
    setNewImageUrl("");
  };

  const handleRemoveImage = async (index: number) => {
    const currentImages = form.getValues('images') || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    
    const reorderedImages = updatedImages.map((img, idx) => ({
      ...img,
      position: idx,
    }));
    
    form.setValue('images', reorderedImages);
    
    const featuredImageId = form.getValues('featured_image_id');
    if (featuredImageId === index) {
      form.setValue('featured_image_id', reorderedImages.length > 0 ? 0 : undefined);
    } else if (featuredImageId !== undefined && featuredImageId > index) {
      form.setValue('featured_image_id', featuredImageId - 1);
    }
    
    await handleImageUpdate(reorderedImages);
  };

  const setFeaturedImage = async (index: number) => {
    form.setValue('featured_image_id', index);
    
    const currentImages = form.getValues('images') || [];
    
    const reorderedImages = currentImages.map((img, idx) => ({
      ...img,
      position: idx === index ? 0 : idx < index ? idx + 1 : idx,
    }));
    
    reorderedImages.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    await handleImageUpdate(reorderedImages);
  };

  const renderImagesTabContent = () => (
    <TabsContent value="images" className="space-y-4">
      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Images</FormLabel>
            <FormControl>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Enter image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full"
                    disabled={isUpdatingImages}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddImage}
                    variant="outline"
                    disabled={isUpdatingImages || !newImageUrl}
                  >
                    {isUpdatingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
                
                {field.value && field.value.length > 0 ? (
                  <div>
                    <div className="mb-2 flex items-center">
                      <p className="text-sm text-muted-foreground mr-2">
                        {field.value.length} {field.value.length === 1 ? 'image' : 'images'} added
                      </p>
                      {form.getValues('featured_image_id') !== undefined && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" /> Featured image selected
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {field.value.map((image, index) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden group">
                          <img
                            src={image.src}
                            alt={image.alt || "Product image"}
                            className="w-full aspect-square object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                              toast({
                                title: "Error",
                                description: "Failed to load image from URL",
                                variant: "destructive",
                              });
                            }}
                          />
                          <div className="absolute top-0 right-0 p-1 bg-background/80 rounded-bl-lg">
                            {form.getValues('featured_image_id') === index ? (
                              <Star className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <StarOff 
                                className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-yellow-500"
                                onClick={() => !isUpdatingImages && setFeaturedImage(index)}
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="absolute bottom-2 right-2"
                              onClick={() => !isUpdatingImages && handleRemoveImage(index)}
                              disabled={isUpdatingImages}
                            >
                              {isUpdatingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            </Button>
                            
                            {form.getValues('featured_image_id') !== index && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="absolute bottom-2 left-2"
                                onClick={() => !isUpdatingImages && setFeaturedImage(index)}
                                disabled={isUpdatingImages}
                              >
                                <Star className="h-4 w-4 mr-1" /> Set as featured
                              </Button>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-xs truncate">
                            {image.name || "Image " + (index + 1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No images added yet. Add product images using the URL input above.
                    </p>
                  </div>
                )}
              </div>
            </FormControl>
            <FormDescription>
              Enter valid URLs for product images. Click on the star icon to set an image as featured.
              {isUpdatingImages && (
                <span className="ml-2 text-blue-500 flex items-center mt-1">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Updating on WooCommerce...
                </span>
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </TabsContent>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product - {product?.name}</DialogTitle>
          <DialogDescription>Make changes to your product details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="regular_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sale_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="on_sale"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">On Sale</FormLabel>
                          <FormDescription>Enable sale pricing for this product</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured Product</FormLabel>
                          <FormDescription>Show in featured products section</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="short_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[150px]" rows={6} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {renderImagesTabContent()}
              
              <TabsContent value="inventory" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Stock Keeping Unit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stock status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="instock">In Stock</SelectItem>
                            <SelectItem value="outofstock">Out of Stock</SelectItem>
                            <SelectItem value="onbackorder">On Backorder</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manage_stock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Manage Stock</FormLabel>
                          <FormDescription>Track stock quantity for this product</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={!form.watch("manage_stock")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="backorders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backorders</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!form.watch("manage_stock")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select backorder option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">Do not allow</SelectItem>
                            <SelectItem value="notify">Allow, but notify customer</SelectItem>
                            <SelectItem value="yes">Allow</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sold_individually"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Sold Individually</FormLabel>
                          <FormDescription>Limit purchases to 1 per order</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="shipping" className="space-y-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="Weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dimensions.length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Length" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensions.width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Width" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensions.height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Height" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shipping_class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Class</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Shipping class" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="taxable">Taxable</SelectItem>
                            <SelectItem value="shipping">Shipping only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tax_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Class</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Tax class" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="seo" className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SEO Title" />
                      </FormControl>
                      <FormDescription>Appears in the title tag of the page</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Meta description" rows={3} />
                      </FormControl>
                      <FormDescription>Appears in search engine results</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Keywords</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Comma-separated keywords" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="catalog_visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catalog Visibility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="visible">Shop and search results</SelectItem>
                          <SelectItem value="catalog">Shop only</SelectItem>
                          <SelectItem value="search">Search results only</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending Review</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="publish">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date_on_sale_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Start Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_on_sale_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale End Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="purchase_note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Note</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Note that will be sent to customers after purchase" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reviews_allowed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Reviews</FormLabel>
                        <FormDescription>Enable customer reviews for this product</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={form.formState.isSubmitting || isUpdatingImages}
                className="flex items-center gap-2"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
