
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MappingState } from './types/import-types';

interface MappingFormProps {
  mappingState: MappingState;
  onUpdateMappings: (newMappings: { [key: string]: string }) => void;
  onAutoMap: () => void;
  onSaveMappings: () => void;
  isSaving: boolean;
}

export const MappingForm: React.FC<MappingFormProps> = ({
  mappingState,
  onUpdateMappings,
  onAutoMap,
  onSaveMappings,
  isSaving,
}) => {
  const { detectedFields, mappings, woocommerceFields } = mappingState;

  return (
    <div className="space-y-4">
      {detectedFields.map((field) => (
        <div key={field} className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">File Field</p>
            <p className="text-sm text-muted-foreground">{field}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">WooCommerce Field</p>
            <Select
              value={mappings[field] || ''}
              onValueChange={(value) => onUpdateMappings({ ...mappings, [field]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {woocommerceFields.map((wooField) => (
                  <SelectItem key={wooField} value={wooField}>
                    {wooField}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1 flex items-center gap-2"
          onClick={onAutoMap}
        >
          <Wand2 className="h-4 w-4" />
          Auto Map
        </Button>
        <Button 
          className="flex-1 flex items-center gap-2" 
          onClick={onSaveMappings}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Mappings'}
        </Button>
      </div>
    </div>
  );
};
