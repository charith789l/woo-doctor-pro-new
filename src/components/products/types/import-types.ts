
export interface ErrorDetail {
  index: number;
  error: string;
}

export interface PreviewProduct {
  [key: string]: string;
}

export interface MappingCardProps {
  fileType: 'csv' | 'xml';
  fileContent: string;
  fileId: string;
  selectedStoreId: string;
  onMappingSaved: () => void;
}

export interface MappingState {
  detectedFields: string[];
  mappings: { [key: string]: string };
  woocommerceFields: string[];
}
