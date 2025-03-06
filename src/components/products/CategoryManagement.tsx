
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CategoryEditDialog } from "@/components/products/CategoryEditDialog";

interface CategoryManagementProps {
  categories: any[];
  woocommerceSettings: any;
}

export function CategoryManagement({ categories, woocommerceSettings }: CategoryManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteCategory = async (categoryId: number) => {
    if (!woocommerceSettings) return;
    
    const { woocommerce_url, consumer_key, consumer_secret } = woocommerceSettings;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);

    const response = await fetch(
      `${woocommerceSettings.woocommerce_url}/wp-json/wc/v3/products/categories/${categoryId}?force=true`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete category');
    }

    return response.json();
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wc-categories'] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const createCategory = async (data: { name: string; description?: string }) => {
    if (!woocommerceSettings) return;

    const { woocommerce_url, consumer_key, consumer_secret } = woocommerceSettings;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);

    const response = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products/categories`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create category');
    }

    return response.json();
  };

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wc-categories'] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategory = async (categoryId: number, data: { name: string; description?: string }) => {
    if (!woocommerceSettings) return;

    const { woocommerce_url, consumer_key, consumer_secret } = woocommerceSettings;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);

    const response = await fetch(
      `${woocommerce_url}/wp-json/wc/v3/products/categories/${categoryId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update category');
    }

    return response.json();
  };

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wc-categories'] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const handleCategoryEdit = async (categoryId: number, data: { name: string; description?: string }) => {
    await updateCategoryMutation.mutateAsync({
      id: categoryId,
      data: {
        name: data.name,
        description: data.description || '',
      },
    });
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <form
          className="flex gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            createCategoryMutation.mutate({
              name: formData.get('name') as string,
              description: formData.get('description') as string,
            });
            form.reset();
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Category name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="submit">Add Category</Button>
        </form>
      </div>
      <div className="p-4">
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Description</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Count</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((category: any) => (
                <tr key={category.id} className="border-b">
                  <td className="p-4">{category.name}</td>
                  <td className="p-4">{category.description}</td>
                  <td className="p-4">{category.count}</td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedCategory(category);
                        setEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this category?')) {
                          deleteCategoryMutation.mutate(category.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <CategoryEditDialog
        category={selectedCategory}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleCategoryEdit}
      />
    </div>
  );
}
