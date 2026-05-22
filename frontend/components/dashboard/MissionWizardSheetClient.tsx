"use client";

import dynamic from "next/dynamic";

const MissionWizardSheet = dynamic(
  () => import("./MissionWizardSheet").then((m) => m.MissionWizardSheet),
  { ssr: false }
);

export function MissionWizardSheetClient() {
  return <MissionWizardSheet />;
}
