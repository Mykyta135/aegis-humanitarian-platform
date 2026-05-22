"use client";

import { useEffect, useState } from "react";
import { TaskFormColumn } from "./TaskFormColumn";
import { TaskList } from "./TaskList";
import { VolunteersColumn } from "./VolunteersColumn";

const WIDGET_KEYS = ["volunteers", "resources", "form", "tasks"];

const defaultLayout = {
  lg: [
    { i: "volunteers", x: 0, y: 0, w: 1, h: 4 },
    { i: "resources", x: 1, y: 0, w: 1, h: 4 },
    { i: "form", x: 2, y: 0, w: 1, h: 4 },
    { i: "tasks", x: 0, y: 4, w: 3, h: 5 },
  ],
};

const widgetComponents: { [key: string]: React.ReactNode } = {
  volunteers: <VolunteersColumn />,
  form: <TaskFormColumn />,
  tasks: <TaskList />,
};

const STORAGE_KEY = "aegis-dashboard-layout";

export function DashboardGridLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const [layouts, setLayouts] = useState(() => {
    if (typeof window !== "undefined") {
      const savedLayouts = localStorage.getItem(STORAGE_KEY);
      if (savedLayouts) return JSON.parse(savedLayouts);
    }
    return defaultLayout;
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {WIDGET_KEYS.map((key) => (
        <div key={key} className="bg-card rounded-lg overflow-hidden shadow">
          {widgetComponents[key]}
        </div>
      ))}
    </div>
  );
}
