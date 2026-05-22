"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskFormColumn } from "./TaskFormColumn";
import { useMissionWizardStore } from "@/stores/use-mission-wizard.store";

export function MissionWizardSheet() {
  const { isOpen, pickingMode, closeWizard } = useMissionWizardStore();

  // Sheet hides while the user is picking a destination on the map so the map
  // is fully accessible. TaskFormColumn is kept mounted inside the sheet DOM
  // using CSS visibility so its useState is preserved across the hide/show cycle.
  const sheetVisible = isOpen && pickingMode === "none";

  return (
    <Sheet open={isOpen} modal={false} onOpenChange={(open) => !open && closeWizard()}>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto transition-transform duration-200"
        style={{ visibility: sheetVisible ? "visible" : "hidden", pointerEvents: sheetVisible ? undefined : "none" }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Create New Mission</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <TaskFormColumn />
        </div>
      </SheetContent>
    </Sheet>
  );
}
