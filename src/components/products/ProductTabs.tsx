
import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, RefreshCw, Plus, Upload, FolderPlus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductTabsProps {
  productsTabContent: ReactNode;
  createTabContent: ReactNode;
  importTabContent: ReactNode;
  categoriesTabContent: ReactNode;
  bulkTabContent: ReactNode;
  onRefresh: () => void;
}

export function ProductTabs({
  productsTabContent,
  createTabContent,
  importTabContent,
  categoriesTabContent,
  bulkTabContent,
  onRefresh,
}: ProductTabsProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Product Management</h1>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Products
        </Button>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full justify-start h-12 bg-card dark:bg-gray-800 border-b shadow-sm rounded-t-lg">
          <TabsTrigger
            value="products"
            className="relative h-12 px-6 transition-all duration-200 data-[state=active]:text-primary data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:left-0 data-[state=active]:before:w-full data-[state=active]:before:h-0.5 data-[state=active]:before:bg-primary data-[state=active]:before:transition-all data-[state=active]:before:duration-200 hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-medium">Products</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="relative h-12 px-6 transition-all duration-200 data-[state=active]:text-primary data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:left-0 data-[state=active]:before:w-full data-[state=active]:before:h-0.5 data-[state=active]:before:bg-primary data-[state=active]:before:transition-all data-[state=active]:before:duration-200 hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-medium">Create Product</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="import"
            className="relative h-12 px-6 transition-all duration-200 data-[state=active]:text-primary data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:left-0 data-[state=active]:before:w-full data-[state=active]:before:h-0.5 data-[state=active]:before:bg-primary data-[state=active]:before:transition-all data-[state=active]:before:duration-200 hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="font-medium">Import Products</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="relative h-12 px-6 transition-all duration-200 data-[state=active]:text-primary data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:left-0 data-[state=active]:before:w-full data-[state=active]:before:h-0.5 data-[state=active]:before:bg-primary data-[state=active]:before:transition-all data-[state=active]:before:duration-200 hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              <span className="font-medium">Category Manager</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="relative h-12 px-6 transition-all duration-200 data-[state=active]:text-primary data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:left-0 data-[state=active]:before:w-full data-[state=active]:before:h-0.5 data-[state=active]:before:bg-primary data-[state=active]:before:transition-all data-[state=active]:before:duration-200 hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Bulk Tools</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="py-4 animate-fade-in">
          {productsTabContent}
        </TabsContent>

        <TabsContent value="create" className="py-4 animate-fade-in">
          {createTabContent}
        </TabsContent>

        <TabsContent value="import" className="py-4 animate-fade-in">
          {importTabContent}
        </TabsContent>

        <TabsContent value="categories" className="py-4 animate-fade-in">
          {categoriesTabContent}
        </TabsContent>

        <TabsContent value="bulk" className="py-4 animate-fade-in">
          {bulkTabContent}
        </TabsContent>
      </Tabs>
    </div>
  );
}
