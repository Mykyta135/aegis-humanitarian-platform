import { create } from "zustand";
import { persist } from "zustand/middleware";

type TaskFormState = {
  assigneeId: string | null;
  resourceIds: string[];
  setAssignee: (id: string) => void;
  toggleResource: (id: string) => void;
  reset: () => void;
};
export const useTaskFormStore = create<TaskFormState>()(
  persist(
    (set) => ({
      assigneeId: null,
      resourceIds: [],
      setAssignee: (id) => set({ assigneeId: id }),
      toggleResource: (id) =>
        set((state) => ({
          resourceIds: state.resourceIds.includes(id)
            ? state.resourceIds.filter((resId) => resId !== id)
            : [...state.resourceIds, id],
        })),
      reset: () => set({ assigneeId: null, resourceIds: [] }),
    }),
    {
      name: "aegis-task-form-storage",
    }
  )
);
