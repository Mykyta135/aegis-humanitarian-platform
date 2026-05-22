"use client";

import { PackageOpen } from "lucide-react"; // Example icon

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No items found",
  description = "There is no data to display here.",
}: EmptyStateProps) {
  return (
    <div className="text-center py-10 border-2 border-dashed rounded-lg">
      <div className="mx-auto h-12 w-12 text-muted-foreground">
        <PackageOpen className="h-full w-full" />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
