
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Percent } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  progress: number;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  onSubmit,
  isProcessing,
  progress
}: BulkEditDialogProps) {
  const [operation, setOperation] = useState<"increase" | "decrease">("increase");
  const [field, setField] = useState<"regular_price" | "sale_price" | "stock_status">("regular_price");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<string>("");
  const [stockStatus, setStockStatus] = useState<"instock" | "outofstock">("instock");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      operation,
      field,
      type,
      value: parseFloat(value),
    };
    
    if (field === "stock_status") {
      data.stockStatus = stockStatus;
    }
    
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Bulk Edit Products</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedCount} selected products
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select field to edit</Label>
              <RadioGroup
                value={field}
                onValueChange={(value) => setField(value as any)}
                className="grid grid-cols-1 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular_price" id="regular_price" />
                  <Label htmlFor="regular_price">Regular Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sale_price" id="sale_price" />
                  <Label htmlFor="sale_price">Sale Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stock_status" id="stock_status" />
                  <Label htmlFor="stock_status">Stock Status</Label>
                </div>
              </RadioGroup>
            </div>

            {field === "stock_status" ? (
              <div className="grid gap-2">
                <Label>Stock Status</Label>
                <RadioGroup
                  value={stockStatus}
                  onValueChange={(value) => setStockStatus(value as any)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="instock" id="instock" />
                    <Label htmlFor="instock">In Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outofstock" id="outofstock" />
                    <Label htmlFor="outofstock">Out of Stock</Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Operation</Label>
                  <RadioGroup
                    value={operation}
                    onValueChange={(value) => setOperation(value as any)}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="increase" id="increase" />
                      <Label htmlFor="increase">Increase</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="decrease" id="decrease" />
                      <Label htmlFor="decrease">Decrease</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Type</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(value) => setType(value as any)}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percent" id="percent" />
                      <Label htmlFor="percent">Percentage (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed">Fixed Amount ($)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Value</Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      {type === "percent" ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step={type === "percent" ? "1" : "0.01"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={type === "percent" ? "10" : "5.99"}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {isProcessing && (
            <div className="py-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Processing... {progress}%
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || (field !== "stock_status" && !value)}
            >
              {isProcessing ? 'Processing...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
