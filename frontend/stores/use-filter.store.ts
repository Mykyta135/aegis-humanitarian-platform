import { create } from "zustand";

interface Filters {
  volunteers: {
    experienceLevel?: string;
    homeBase?: string;
    skill?: string;
    name?: string;
    status?: string;
  };
  resources: {
    type?: string;
    condition?: string;
    location?: string;
    name?: string;
    status?: string;
  };
}

interface FilterState {
  filters: Filters;
  setVolunteerFilter: (
    filter: keyof Filters["volunteers"],
    value: string | undefined
  ) => void;
  setResourceFilter: (
    filter: keyof Filters["resources"],
    value: string | undefined
  ) => void;
  clearVolunteerFilters: () => void;
  clearResourceFilters: () => void;
}

const initialFilters: Filters = {
  volunteers: {
    name: "", // <-- Initialize
  },
  resources: {
    name: "", // <-- Initialize
  },
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: initialFilters,

  setVolunteerFilter: (filter, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        volunteers: { ...state.filters.volunteers, [filter]: value },
      },
    })),

  setResourceFilter: (filter, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        resources: { ...state.filters.resources, [filter]: value },
      },
    })),

  clearVolunteerFilters: () =>
    set((state) => ({
      filters: { ...state.filters, volunteers: initialFilters.volunteers },
    })),

  clearResourceFilters: () =>
    set((state) => ({
      filters: { ...state.filters, resources: initialFilters.resources },
    })),
}));
