import { create } from 'zustand';

interface NodePickerState {
    isOpen: boolean;
    position: { x: number; y: number };
    edgeId: string | null;
    onSelectCallback: ((nodeType: string) => void) | null;

    openPicker: (
        position: { x: number; y: number },
        edgeId: string,
        onSelect: (nodeType: string) => void
    ) => void;
    closePicker: () => void;
}

export const useNodePickerStore = create<NodePickerState>((set) => ({
    isOpen: false,
    position: { x: 0, y: 0 },
    edgeId: null,
    onSelectCallback: null,

    openPicker: (position, edgeId, onSelect) => {
        set({
            isOpen: true,
            position,
            edgeId,
            onSelectCallback: onSelect,
        });
    },

    closePicker: () => {
        set({
            isOpen: false,
            edgeId: null,
            onSelectCallback: null,
        });
    },
}));
