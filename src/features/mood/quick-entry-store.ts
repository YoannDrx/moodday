import { create } from "zustand";

type MoodEntryData = {
  id: string;
  value: number;
  note: string | null;
  createdAt: Date;
};

type QuickEntryState = {
  isOpen: boolean;
  editingEntry: MoodEntryData | null;
  open: () => void;
  openForEdit: (entry: MoodEntryData) => void;
  close: () => void;
  toggle: () => void;
};

export const useQuickEntryStore = create<QuickEntryState>((set) => ({
  isOpen: false,
  editingEntry: null,
  open: () => set({ isOpen: true, editingEntry: null }),
  openForEdit: (entry) => set({ isOpen: true, editingEntry: entry }),
  close: () => set({ isOpen: false, editingEntry: null }),
  toggle: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      editingEntry: state.isOpen ? null : state.editingEntry,
    })),
}));
