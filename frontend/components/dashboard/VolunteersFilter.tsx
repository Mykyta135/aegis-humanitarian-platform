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
import { Filter, X } from "lucide-react";

// Hardcode some options for the filters. In a real app, these might come from an API.
const experienceLevels = ["trainee", "junior", "senior", "expert"];
const bases = ["Kyiv", "Lviv", "Kharkiv", "Odesa", "Dnipro"];
const skills = ["medic", "driver", "translator", "coordinator", "electrician"];

export function VolunteersFilter() {
  const { filters, setVolunteerFilter, clearVolunteerFilters } =
    useFilterStore();

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
          <SheetTitle>Filter Volunteers</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {/* Experience Level Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="experience" className="text-right">
              Experience
            </Label>
            <Select
              value={filters.volunteers.experienceLevel}
              onValueChange={(value) =>
                setVolunteerFilter("experienceLevel", value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Home Base Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="base" className="text-right">
              Home Base
            </Label>
            <Select
              value={filters.volunteers.homeBase}
              onValueChange={(value) => setVolunteerFilter("homeBase", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {bases.map((base) => (
                  <SelectItem key={base} value={base}>
                    {base}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Skill Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skill" className="text-right">
              Skill
            </Label>
            <Select
              value={filters.volunteers.skill}
              onValueChange={(value) => setVolunteerFilter("skill", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={clearVolunteerFilters}>
            Clear Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
