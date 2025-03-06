
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PreviewProduct } from './types/import-types';
import { truncateText } from './utils/importUtils';

interface MappingPreviewProps {
  previewProducts: PreviewProduct[];
  mappings: { [key: string]: string };
  totalProducts: number;
}

export const MappingPreview: React.FC<MappingPreviewProps> = ({
  previewProducts,
  mappings,
  totalProducts,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ value: string } | null>(null);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Preview Products</h3>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {Object.values(mappings).filter(Boolean).map((field) => (
                <TableHead key={field} className="whitespace-nowrap">
                  {field}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewProducts.map((product, index) => (
              <TableRow key={index}>
                {Object.values(mappings).filter(Boolean).map((field) => (
                  <TableCell key={field} className="max-w-[200px]">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="w-full text-left hover:text-primary focus:outline-none focus:text-primary transition-colors"
                          onClick={() => setSelectedCell({ value: product[field] || '-' })}
                        >
                          {truncateText(product[field])}
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex justify-between items-center">
                            {field}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedCell(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                          <p className="whitespace-pre-wrap break-words">{selectedCell?.value}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Total products in file: {totalProducts}
      </p>
    </div>
  );
};
