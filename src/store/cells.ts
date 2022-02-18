import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// All Cells are code
export interface CellInfo {
  id: string;
  source: string;
  executed: string;
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
  },
});

export default cells;
