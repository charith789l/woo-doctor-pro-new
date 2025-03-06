
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, Image as ImageIcon, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  regular_price: z.string().min(1, "Regular price is required"),
  description: z.string(),
  short_description: z.string(),
  categories: z.array(z.number()),
  stock_quantity: z.number().min(0),
  sku: z.string(),
  manage_stock: z.boolean(),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]),
  images: z.array(z.object({
    src: z.string().url("Please enter a valid image URL"),
    name: z.string(),
    alt: z.string().optional(),
    position: z.number().optional(),
  })).optional(),
  featured_image_id: z.number().optional(),
  backorders: z.enum(["no", "notify", "yes"]).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  id: number;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting: boolean;
}

export const ProductForm = ({ categories, onSubmit, isSubmitting }: ProductFormProps) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      regular_price: "",
      description: "",
      short_description: "",
      categories: [],
      stock_quantity: 0,
      sku: "",
      manage_stock: true,
      stock_status: "instock",
      images: [],
      featured_image_id: 0,
    },
  });

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
  };

  const handleAddImage = () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    const currentImages = form.getValues('images') || [];
    const isFeatured = currentImages.length === 0; // First image is featured by default
    
    const newImage = {
      src: imageUrl,
      name: imageUrl.split('/').pop() || 'product-image',
      alt: form.getValues('name') || 'Product image',
      position: currentImages.length,
    };
    
    const updatedImages = [...currentImages, newImage];
    form.setValue('images', updatedImages);
    
    // Set the first image as featured by default
    if (isFeatured) {
      form.setValue('featured_image_id', 0);
    }
    
    setImageUrl("");
    setImageUrls([...imageUrls, imageUrl]);
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    
    // Recalculate positions after removal
    const reorderedImages = updatedImages.map((img, idx) => ({
      ...img,
      position: idx,
    }));
    
    form.setValue('images', reorderedImages);
    
    // Update featured image if needed
    const featuredImageId = form.getValues('featured_image_id');
    if (featuredImageId === index) {
      // If removed image was featured, set first image as featured or clear
      form.setValue('featured_image_id', reorderedImages.length > 0 ? 0 : undefined);
    } else if (featuredImageId !== undefined && featuredImageId > index) {
      // Adjust featured image id if it was after the removed image
      form.setValue('featured_image_id', featuredImageId - 1);
    }
    
    // Update image URLs array
    const newUrls = [...imageUrls];
    newUrls.splice(index, 1);
    setImageUrls(newUrls);
  };

  const setFeaturedImage = (index: number) => {
    form.setValue('featured_image_id', index);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
        <CardDescription>
          Add a new product to your WooCommerce store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
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
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manage_stock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Manage Stock</FormLabel>
                    <FormDescription>
                      Enable stock management at product level
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const newCategories = [...field.value];
                      const categoryId = parseInt(value);
                      if (!newCategories.includes(categoryId)) {
                        newCategories.push(categoryId);
                        field.onChange(newCategories);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select categories" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.value.map((categoryId) => {
                      const category = categories?.find((c) => c.id === categoryId);
                      return category ? (
                        <Badge
                          key={categoryId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {category.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const newCategories = field.value.filter((id) => id !== categoryId);
                              field.onChange(newCategories);
                            }}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          value={imageUrl}
                          onChange={handleImageUrlChange}
                          className="w-full"
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddImage}
                          variant="outline"
                        >
                          Add
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
                                      onClick={() => setFeaturedImage(index)}
                                    />
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="absolute bottom-2 right-2"
                                    onClick={() => handleRemoveImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  
                                  {form.getValues('featured_image_id') !== index && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="absolute bottom-2 left-2"
                                      onClick={() => setFeaturedImage(index)}
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
                    Enter valid URLs for product images. The first image will be set as featured by default.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creating Product...
                </div>
              ) : (
                "Create Product"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
