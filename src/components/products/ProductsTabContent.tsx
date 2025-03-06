import { useState, useMemo } from "react";
import { ProductList } from "@/components/products/ProductList";
import { ProductFilters } from "@/components/products/ProductFilters";

interface ProductsTabContentProps {
  products: any[];
  categories: any[];
  isLoading: boolean;
  woocommerceSettings?: any;
}

export function ProductsTabContent({ products, categories, isLoading, woocommerceSettings }: ProductsTabContentProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  
  const [featured, setFeatured] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("all");
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([undefined, undefined]);
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rating, setRating] = useState(0);
  const [productType, setProductType] = useState("all");

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];
    
    if (search !== "") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) || 
        product.sku?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    if (category !== "all") {
      filtered = filtered.filter(product => 
        product.categories && product.categories.some((cat: { id: number }) => 
          cat.id.toString() === category
        )
      );
    }

    if (status !== "all") {
      filtered = filtered.filter(product => product.status === status);
    }

    if (stockStatus !== "all") {
      filtered = filtered.filter(product => product.stock_status === stockStatus);
    }

    if (priceRange !== "all") {
      const price = (product: any) => parseFloat(String(product.price || 0));
      
      filtered = filtered.filter(product => {
        const productPrice = price(product);
        if (priceRange === "under50") return productPrice < 50;
        if (priceRange === "50to100") return productPrice >= 50 && productPrice <= 100;
        if (priceRange === "over100") return productPrice > 100;
        return true;
      });
    }

    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      
      filtered = filtered.filter(product => {
        const price = parseFloat(String(product.price || 0));
        return price >= min && price <= max;
      });
    }

    if (featured) {
      filtered = filtered.filter(product => product.featured);
    }

    if (onSale) {
      filtered = filtered.filter(product => {
        const regularPrice = parseFloat(String(product.regular_price || 0));
        const salePrice = parseFloat(String(product.sale_price || 0));
        return salePrice > 0 && salePrice < regularPrice;
      });
    }

    if (stockQuantity !== "all") {
      filtered = filtered.filter(product => {
        const quantity = parseInt(String(product.stock_quantity || 0));
        
        if (stockQuantity === "nostock") return quantity === 0;
        if (stockQuantity === "lowstock") return quantity > 0 && quantity <= 10;
        if (stockQuantity === "instock") return quantity > 10 && quantity <= 50;
        if (stockQuantity === "wellstocked") return quantity > 50;
        return true;
      });
    }

    if (dateFilter !== "all" && (dateRange[0] || dateRange[1])) {
      const startDate = dateRange[0] ? new Date(dateRange[0]) : new Date(0);
      const endDate = dateRange[1] ? new Date(dateRange[1]) : new Date();
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(product => {
        let dateToCheck;
        
        if (dateFilter === "created") {
          dateToCheck = new Date(product.date_created);
        } else {
          dateToCheck = new Date(product.date_modified);
        }
        
        return dateToCheck >= startDate && dateToCheck <= endDate;
      });
    }

    if (productType !== "all") {
      filtered = filtered.filter(product => product.type === productType);
    }

    if (rating > 0) {
      filtered = filtered.filter(product => {
        const productRating = parseFloat(String(product.average_rating || 0));
        return productRating >= rating;
      });
    }

    if (sortBy !== "date" || sortOrder !== "desc") {
      filtered.sort((a, b) => {
        let valueA, valueB;
        
        switch(sortBy) {
          case "title":
            valueA = a.name?.toLowerCase() || "";
            valueB = b.name?.toLowerCase() || "";
            break;
          case "price":
            valueA = parseFloat(String(a.price || 0));
            valueB = parseFloat(String(b.price || 0));
            break;
          case "stock":
            valueA = parseInt(String(a.stock_quantity || 0));
            valueB = parseInt(String(b.stock_quantity || 0));
            break;
          case "sales":
            valueA = parseInt(String(a.total_sales || 0));
            valueB = parseInt(String(b.total_sales || 0));
            break;
          case "modified":
            valueA = new Date(a.date_modified || 0).getTime();
            valueB = new Date(b.date_modified || 0).getTime();
            break;
          case "date":
          default:
            valueA = new Date(a.date_created || 0).getTime();
            valueB = new Date(b.date_created || 0).getTime();
        }
        
        if (sortOrder === "asc") {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [
    products, search, category, status, stockStatus, priceRange, 
    featured, onSale, minPrice, maxPrice, stockQuantity, 
    dateRange, dateFilter, sortBy, sortOrder, rating, productType
  ]);

  return (
    <div className="rounded-lg border bg-card">
      <ProductFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        stockStatus={stockStatus}
        setStockStatus={setStockStatus}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        categories={categories || []}
        featured={featured}
        setFeatured={setFeatured}
        onSale={onSale}
        setOnSale={setOnSale}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        stockQuantity={stockQuantity}
        setStockQuantity={setStockQuantity}
        dateRange={dateRange}
        setDateRange={setDateRange}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        rating={rating}
        setRating={setRating}
        productType={productType}
        setProductType={setProductType}
      />
      <div className="p-4">
        <ProductList
          products={filteredProducts || []}
          isLoading={isLoading}
          woocommerceSettings={woocommerceSettings}
        />
      </div>
    </div>
  );
}
