
import { useState } from "react";
import { Search, SlidersHorizontal, X, Calendar, StarIcon, Tag, Disc, BarChart4, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
}

interface ProductFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  stockStatus: string;
  setStockStatus: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  categories: Category[];
  // New filter props
  featured?: boolean;
  setFeatured?: (value: boolean) => void;
  onSale?: boolean;
  setOnSale?: (value: boolean) => void;
  minPrice?: string;
  setMinPrice?: (value: string) => void;
  maxPrice?: string;
  setMaxPrice?: (value: string) => void;
  stockQuantity?: string;
  setStockQuantity?: (value: string) => void;
  dateRange?: [Date | undefined, Date | undefined];
  setDateRange?: (value: [Date | undefined, Date | undefined]) => void;
  dateFilter?: string;
  setDateFilter?: (value: string) => void;
  sortBy?: string;
  setSortBy?: (value: string) => void;
  sortOrder?: string;
  setSortOrder?: (value: string) => void;
  rating?: number;
  setRating?: (value: number) => void;
  productType?: string;
  setProductType?: (value: string) => void;
}

export const ProductFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  status,
  setStatus,
  stockStatus,
  setStockStatus,
  priceRange,
  setPriceRange,
  categories,
  // New filter props with defaults
  featured = false,
  setFeatured = () => {},
  onSale = false,
  setOnSale = () => {},
  minPrice = "",
  setMinPrice = () => {},
  maxPrice = "",
  setMaxPrice = () => {},
  stockQuantity = "all",
  setStockQuantity = () => {},
  dateRange = [undefined, undefined],
  setDateRange = () => {},
  dateFilter = "all",
  setDateFilter = () => {},
  sortBy = "date",
  setSortBy = () => {},
  sortOrder = "desc",
  setSortOrder = () => {},
  rating = 0,
  setRating = () => {},
  productType = "all",
  setProductType = () => {},
}: ProductFiltersProps) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  
  // Helper for date formatting
  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "PPP");
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (category !== "all") count++;
    if (status !== "all") count++;
    if (stockStatus !== "all") count++;
    if (priceRange !== "all") count++;
    if (featured) count++;
    if (onSale) count++;
    if (minPrice || maxPrice) count++;
    if (stockQuantity !== "all") count++;
    if (dateRange[0] || dateRange[1]) count++;
    if (rating > 0) count++;
    if (productType !== "all") count++;
    return count;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setCategory("all");
    setStatus("all");
    setStockStatus("all");
    setPriceRange("all");
    setFeatured(false);
    setOnSale(false);
    setMinPrice("");
    setMaxPrice("");
    setStockQuantity("all");
    setDateRange([undefined, undefined]);
    setDateFilter("all");
    setRating(0);
    setProductType("all");
  };

  return (
    <div className="p-4 border-b space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Sheet open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 relative">
              <SlidersHorizontal className="h-4 w-4" />
              Advanced Filters
              {countActiveFilters() > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {countActiveFilters()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md w-full">
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down your product list
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <Tabs defaultValue="basic" className="w-full mt-4">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                {/* Basic Filters Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="publish">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Type</label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="variable">Variable</SelectItem>
                          <SelectItem value="grouped">Grouped</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Properties</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="featured" className="cursor-pointer">Featured Products</Label>
                        <Switch 
                          id="featured" 
                          checked={featured} 
                          onCheckedChange={setFeatured} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="onSale" className="cursor-pointer">On Sale</Label>
                        <Switch 
                          id="onSale" 
                          checked={onSale} 
                          onCheckedChange={setOnSale} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="minPrice" className="text-xs">Min Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input 
                            id="minPrice"
                            type="number" 
                            placeholder="Min" 
                            value={minPrice} 
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="pl-7"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="maxPrice" className="text-xs">Max Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input 
                            id="maxPrice"
                            type="number" 
                            placeholder="Max" 
                            value={maxPrice} 
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="pl-7"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">or select predefined range:</p>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="under50">Under $50</SelectItem>
                          <SelectItem value="50to100">$50 to $100</SelectItem>
                          <SelectItem value="over100">Over $100</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                {/* Inventory Filters Tab */}
                <TabsContent value="inventory" className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Status</label>
                    <Select value={stockStatus} onValueChange={setStockStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stock status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All Stock Status</SelectItem>
                          <SelectItem value="instock">In Stock</SelectItem>
                          <SelectItem value="outofstock">Out of Stock</SelectItem>
                          <SelectItem value="onbackorder">On Backorder</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Quantity</label>
                    <Select value={stockQuantity} onValueChange={setStockQuantity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stock quantity range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">Any Quantity</SelectItem>
                          <SelectItem value="nostock">No Stock (0)</SelectItem>
                          <SelectItem value="lowstock">Low Stock (1-10)</SelectItem>
                          <SelectItem value="instock">In Stock (11-50)</SelectItem>
                          <SelectItem value="wellstocked">Well Stocked (50+)</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                {/* Advanced Filters Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Filter</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">No Date Filter</SelectItem>
                          <SelectItem value="created">Creation Date</SelectItem>
                          <SelectItem value="modified">Last Modified</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    
                    {dateFilter !== "all" && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-10"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateRange[0] ? (
                                  formatDate(dateRange[0])
                                ) : (
                                  <span className="text-muted-foreground">Pick date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={dateRange[0]}
                                onSelect={(date) => setDateRange([date, dateRange[1]])}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-10"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateRange[1] ? (
                                  formatDate(dateRange[1])
                                ) : (
                                  <span className="text-muted-foreground">Pick date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <CalendarComponent
                                mode="single"
                                selected={dateRange[1]}
                                onSelect={(date) => setDateRange([dateRange[0], date])}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        value={[rating]} 
                        onValueChange={(value) => setRating(value[0])} 
                        max={5} 
                        step={1}
                        className="flex-1"
                      />
                      <div className="flex items-center space-x-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={cn(
                              "h-4 w-4", 
                              i < rating ? "fill-current" : "fill-none"
                            )} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground min-w-8 text-center">
                        {rating > 0 ? rating : 'Any'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="date">Date Created</SelectItem>
                            <SelectItem value="modified">Date Modified</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="stock">Stock Quantity</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger>
                          <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-6 border-t">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            </ScrollArea>
            <SheetFooter className="pt-2">
              <Button onClick={() => setIsAdvancedFiltersOpen(false)}>
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-wrap gap-2">
        {search && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Search: {search}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch("")} />
          </Badge>
        )}
        {category !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Category: {categories?.find(cat => cat.id.toString() === category)?.name}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory("all")} />
          </Badge>
        )}
        {status !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setStatus("all")} />
          </Badge>
        )}
        {stockStatus !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Stock: {stockStatus === "instock" ? "In Stock" : stockStatus === "outofstock" ? "Out of Stock" : "On Backorder"}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setStockStatus("all")} />
          </Badge>
        )}
        {priceRange !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Price: {priceRange === "under50" ? "Under $50" : priceRange === "50to100" ? "$50 to $100" : "Over $100"}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange("all")} />
          </Badge>
        )}
        {featured && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Featured
            <X className="h-3 w-3 cursor-pointer" onClick={() => setFeatured(false)} />
          </Badge>
        )}
        {onSale && (
          <Badge variant="secondary" className="flex items-center gap-1">
            On Sale
            <X className="h-3 w-3 cursor-pointer" onClick={() => setOnSale(false)} />
          </Badge>
        )}
        {(minPrice || maxPrice) && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Custom Price: {minPrice ? `$${minPrice}` : "$0"} - {maxPrice ? `$${maxPrice}` : "Any"}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setMinPrice("");
              setMaxPrice("");
            }} />
          </Badge>
        )}
        {stockQuantity !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Stock Qty: {
              stockQuantity === "nostock" ? "No Stock" : 
              stockQuantity === "lowstock" ? "Low Stock" :
              stockQuantity === "instock" ? "In Stock" : "Well Stocked"
            }
            <X className="h-3 w-3 cursor-pointer" onClick={() => setStockQuantity("all")} />
          </Badge>
        )}
        {(dateRange[0] || dateRange[1]) && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Date ({dateFilter === "created" ? "Created" : "Modified"}): 
            {dateRange[0] ? ` From ${formatDate(dateRange[0])}` : ""} 
            {dateRange[1] ? ` To ${formatDate(dateRange[1])}` : ""}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateRange([undefined, undefined])} />
          </Badge>
        )}
        {rating > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Rating: {rating}+ Stars
            <X className="h-3 w-3 cursor-pointer" onClick={() => setRating(0)} />
          </Badge>
        )}
        {productType !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Type: {productType.charAt(0).toUpperCase() + productType.slice(1)}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setProductType("all")} />
          </Badge>
        )}
        {sortBy !== "date" || sortOrder !== "desc" ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            Sort: {
              sortBy === "date" ? "Date Created" :
              sortBy === "modified" ? "Date Modified" :
              sortBy === "title" ? "Title" :
              sortBy === "price" ? "Price" :
              sortBy === "stock" ? "Stock" : "Sales"
            } ({sortOrder === "asc" ? "A-Z" : "Z-A"})
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setSortBy("date");
              setSortOrder("desc");
            }} />
          </Badge>
        ) : null}
      </div>
    </div>
  );
};
