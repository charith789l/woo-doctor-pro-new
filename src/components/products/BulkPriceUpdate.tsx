
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, ArrowDownIcon, DollarSign, Tag, Loader } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  operation: z.enum(["increase", "decrease"]),
  priceType: z.enum(["regular_price", "sale_price"]),
  percentage: z.coerce
    .number()
    .min(0.01, "Percentage must be greater than 0")
    .max(100, "Percentage must be less than or equal to 100"),
});

type BulkPriceUpdateFormValues = z.infer<typeof formSchema>;

interface BulkPriceUpdateProps {
  onSubmit: (values: BulkPriceUpdateFormValues) => void;
  isLoading: boolean;
  progress: number;
  updateStats: { processed: number; total: number };
}

export function BulkPriceUpdate({ 
  onSubmit, 
  isLoading, 
  progress, 
  updateStats 
}: BulkPriceUpdateProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    if (progress > displayProgress) {
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          const next = Math.min(prev + 1, progress);
          if (next >= progress) {
            clearInterval(interval);
          }
          return next;
        });
      }, 20); // Update every 20ms for smooth animation

      return () => clearInterval(interval);
    } else if (progress === 0) {
      setDisplayProgress(0);
    }
  }, [progress]);

  const form = useForm<BulkPriceUpdateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operation: "increase",
      priceType: "regular_price",
      percentage: 0,
    },
  });

  const handleSubmit = (values: BulkPriceUpdateFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
          <FormField
            control={form.control}
            name="operation"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Operation</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem
                          value="increase"
                          id="increase"
                          className="peer sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="increase"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-muted dark:hover:bg-gray-700 dark:border-gray-600 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <ArrowUpIcon className="mb-3 h-6 w-6 text-green-500" />
                        <span className="text-sm font-medium">Increase</span>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem
                          value="decrease"
                          id="decrease"
                          className="peer sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="decrease"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-muted dark:hover:bg-gray-700 dark:border-gray-600 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <ArrowDownIcon className="mb-3 h-6 w-6 text-red-500" />
                        <span className="text-sm font-medium">Decrease</span>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Price Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem
                          value="regular_price"
                          id="regular_price"
                          className="peer sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="regular_price"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-muted dark:hover:bg-gray-700 dark:border-gray-600 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <DollarSign className="mb-3 h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Regular Price</span>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem
                          value="sale_price"
                          id="sale_price"
                          className="peer sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="sale_price"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-muted dark:hover:bg-gray-700 dark:border-gray-600 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Tag className="mb-3 h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Sale Price</span>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentage (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder="Enter percentage (1-100)"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isLoading && (
            <div className="space-y-2">
              <Progress value={displayProgress} className="h-2" />
              <div className="text-sm text-muted-foreground text-center">
                Updating products: {updateStats.processed} / {updateStats.total}
                {updateStats.processed > 0 && (
                  <span className="ml-2">
                    ({Math.round(displayProgress)}%)
                  </span>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Updating Prices...</span>
              </div>
            ) : (
              "Update Prices"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
