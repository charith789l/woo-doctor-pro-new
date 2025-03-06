
import { useState } from "react";
import { BulkPriceUpdate } from "@/components/products/BulkPriceUpdate";

interface BulkUpdateSectionProps {
  onBulkUpdate: (data: any) => Promise<void>;
  isUpdating: boolean;
  progress: number;
  updateProgress: { processed: number; total: number };
}

export function BulkUpdateSection({
  onBulkUpdate,
  isUpdating,
  progress,
  updateProgress
}: BulkUpdateSectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Bulk Price Update</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Update product prices in bulk by percentage
          </p>
        </div>
        <div className="p-4">
          <BulkPriceUpdate
            onSubmit={onBulkUpdate}
            isLoading={isUpdating}
            progress={progress}
            updateStats={updateProgress}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card dark:bg-gray-800 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4">More Bulk Tools Coming Soon</h2>
        <p className="text-muted-foreground">
          Additional bulk operations functionality will be available soon. This will include features like:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
          <li>Bulk category assignment</li>
          <li>Bulk status changes</li>
          <li>Bulk stock management</li>
        </ul>
      </div>
    </div>
  );
}
