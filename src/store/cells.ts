import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

// All Cells are code
export interface CellInfo {
  id: string;
  source: string;
  attachedKernelId?: string;
  executed?: string;
  lastError?: string;
}

export type CellState = Record<string, CellInfo>;

const cells = createSlice({
  name: "cells",
  initialState: {} as CellState,
  reducers: {
    add: (
      state: CellState,
      action: PayloadAction<{ id: string; source: string }>
    ) => {
      const { id, source } = action.payload;
      return {
        ...state,
        [id]: { id, source, executed: "" },
      };
    },
    attachKernel: (
      state: CellState,
      action: PayloadAction<{ id: string; kernelId: string }>
    ) => {
      const { id, kernelId } = action.payload;
      if (state[id].attachedKernelId === kernelId) return state;
      return {
        ...state,
        [id]: { ...state[id], attachedKernelId: kernelId },
      };
    },
    detachKernel: (state: CellState, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      if (!state[id].attachedKernelId) return state;
      return {
        ...state,
        [id]: { ...state[id], attachedKernelId: undefined },
      };
    },
    executed: (
      state: CellState,
      action: PayloadAction<{ id: string; executed: string }>
    ) => {
      const { id, executed } = action.payload;
      if (state[id].executed === executed) return state;
      return {
        ...state,
        [id]: { ...state[id], executed },
      };
    },
    error: (
      state: CellState,
      action: PayloadAction<{ id: string; timestamp: string; message: string }>
    ) => {
      const { id, message } = action.payload;
      if (state[id].lastError === message) return state;
      return {
        ...state,
        id: { ...state[id], lastError: message },
      };
    },
  },
});

function selectAttachedKernelId(state: State, cellId: string) {
  return state.thebe.cells[cellId].attachedKernelId;
}

export const selectors = {
  selectAttachedKernelId,
};

export default cells;
