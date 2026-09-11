import { create } from "zustand";
import { ExpertiseLevel } from "../types";

interface ExpertiseState {
  level: ExpertiseLevel;
  setLevel: (level: ExpertiseLevel) => void;
}

// Single source of truth for the adaptive UX split (Level 1/2/3 behavior
// matrix in the architecture doc). Every page reads from here rather than
// forking logic locally, so switching levels never re-runs the pipeline —
// it just re-renders the same data through a different template.
export const useExpertiseStore = create<ExpertiseState>((set) => ({
  level: "BEGINNER",
  setLevel: (level) => set({ level }),
}));
