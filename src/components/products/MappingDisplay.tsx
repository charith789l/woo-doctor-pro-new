
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface FieldMapping {
  file_field_name: string;
  woocommerce_field: string;
  is_data_valid?: boolean;
  woocommerce_data_type?: string;
  woocommerce_field_format?: {
    enum?: string[];
  };
}

interface MappingDisplayProps {
  mappings: FieldMapping[];
  isLoading: boolean;
}

export function MappingDisplay({ mappings, isLoading }: MappingDisplayProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Loading mappings...</div>;
  }

  const sortedMappings = [...mappings].sort((a, b) => 
    a.woocommerce_field.localeCompare(b.woocommerce_field)
  );

  const getDataTypeLabel = (mapping: FieldMapping) => {
    if (mapping.woocommerce_field_format?.enum) {
      return `Enum (${mapping.woocommerce_field_format.enum.join(', ')})`;
    }
    return mapping.woocommerce_data_type || 'string';
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">WooCommerce Field Mappings</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {sortedMappings.map((mapping, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {mapping.woocommerce_field}
                      </span>
                      <Badge
                        variant={mapping.is_data_valid ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {mapping.is_data_valid ? "Valid" : "Invalid"}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Data Type: {getDataTypeLabel(mapping)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Mapped from: {mapping.file_field_name}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-arrow-right"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {index < sortedMappings.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
