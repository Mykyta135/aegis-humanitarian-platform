"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useFilterStore } from "@/stores/use-filter.store";
import { Filter } from "lucide-react";

// Hardcode filter options
const resourceTypes = ["vehicle", "generator", "drone", "medical_kit"];
const conditions = ["excellent", "good", "needs_maintenance", "inoperable"];
const locations = [
  "Kyiv Warehouse",
  "Kharkiv Base",
  "Lviv Depot",
  "Field Base Alpha",
];

export function ResourcesFilter() {
  const { filters, setResourceFilter, clearResourceFilters } = useFilterStore();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Filter className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Filter
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Resources</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {/* Resource Type Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={filters.resources.type}
              onValueChange={(value) => setResourceFilter("type", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Condition Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="condition" className="text-right">
              Condition
            </Label>
            <Select
              value={filters.resources.condition}
              onValueChange={(value) => setResourceFilter("condition", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((con) => (
                  <SelectItem key={con} value={con}>
                    {con.replace("_", " ").charAt(0).toUpperCase() +
                      con.replace("_", " ").slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Location Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Select
              value={filters.resources.location}
              onValueChange={(value) => setResourceFilter("location", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={clearResourceFilters}>
            Clear Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
