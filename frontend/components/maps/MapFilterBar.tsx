"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFilterStore } from "@/stores/use-filter.store";
import { Filter, X } from "lucide-react";

const SKILLS = ["medic", "driver", "translator", "coordinator", "electrician", "mechanic", "cook", "engineer"];
const EXPERIENCE_LEVELS = ["trainee", "junior", "senior", "expert"];
const VOLUNTEER_STATUSES = ["available", "on_mission", "unavailable"];
const RESOURCE_TYPES = ["vehicle", "generator", "drone", "medical_kit"];
const RESOURCE_CONDITIONS = ["excellent", "good", "needs_maintenance", "inoperable"];
const RESOURCE_STATUSES = ["available", "in_use", "maintenance"];

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

export function MapFilterBar() {
  const { filters, setVolunteerFilter, setResourceFilter, clearVolunteerFilters, clearResourceFilters } =
    useFilterStore();

  const activeFilterCount =
    Object.values(filters.volunteers).filter((v) => v && v !== "").length +
    Object.values(filters.resources).filter((v) => v && v !== "").length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
          {activeFilterCount > 0 && (
            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="z-[1001] w-[320px] overflow-y-auto overflow-x-visible">
        <SheetHeader>
          <SheetTitle>Filter Map Assets</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* ── VOLUNTEERS ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Volunteers</p>

            <FilterRow label="Name">
              <Input
                value={filters.volunteers.name ?? ""}
                onChange={(e) => setVolunteerFilter("name", e.target.value || undefined)}
                placeholder="Search by name…"
                className="h-8 text-sm"
              />
            </FilterRow>

            <FilterRow label="Skill">
              <Select
                value={filters.volunteers.skill ?? "all"}
                onValueChange={(v) => setVolunteerFilter("skill", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any skill" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">Any skill</SelectItem>
                  {SKILLS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow label="Experience">
              <Select
                value={filters.volunteers.experienceLevel ?? "all"}
                onValueChange={(v) => setVolunteerFilter("experienceLevel", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">Any level</SelectItem>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow label="Status">
              <Select
                value={filters.volunteers.status ?? "all"}
                onValueChange={(v) => setVolunteerFilter("status", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">Any status</SelectItem>
                  {VOLUNTEER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterRow>

            {Object.values(filters.volunteers).some((v) => v && v !== "") && (
              <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={clearVolunteerFilters}>
                <X className="h-3 w-3 mr-1" /> Clear volunteer filters
              </Button>
            )}
          </div>

          <Separator />

          {/* ── RESOURCES ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Resources</p>

            <FilterRow label="Name">
              <Input
                value={filters.resources.name ?? ""}
                onChange={(e) => setResourceFilter("name", e.target.value || undefined)}
                placeholder="Search by name…"
                className="h-8 text-sm"
              />
            </FilterRow>

            <FilterRow label="Type">
              <Select
                value={filters.resources.type ?? "all"}
                onValueChange={(v) => setResourceFilter("type", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">Any type</SelectItem>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow label="Condition">
              <Select
                value={filters.resources.condition ?? "all"}
                onValueChange={(v) => setResourceFilter("condition", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any condition" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">Any condition</SelectItem>
                  {RESOURCE_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace("_", " ").replace(/^\w/, (ch) => ch.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow label="Status">
              <Select
                value={filters.resources.status ?? "all"}
                onValueChange={(v) => setResourceFilter("status", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">Any status</SelectItem>
                  {RESOURCE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterRow>

            {Object.values(filters.resources).some((v) => v && v !== "") && (
              <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={clearResourceFilters}>
                <X className="h-3 w-3 mr-1" /> Clear resource filters
              </Button>
            )}
          </div>
        </div>

        <SheetFooter>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => { clearVolunteerFilters(); clearResourceFilters(); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear all ({activeFilterCount})
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
