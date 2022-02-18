import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CellState } from "./cells";
import { State } from "./types";

export interface NotebookInfo {
  id: string;
  cells: string[];
}

export type NotebookState = Record<string, NotebookInfo>;

const notebooks = createSlice({
  name: "notebooks",
  initialState: {} as NotebookState,
  reducers: {
    setup: (
      state: NotebookState,
      action: PayloadAction<{ id: string; cells: string[] }>
    ) => {
      const { id, cells } = action.payload;
      return {
        ...state,
        [id]: { id, cells },
      };
    },
  },
});

const getCellsForNotebook = createSelector(
  (state: State) => state.thebe.cells,
  (state: State, notebookId: string) => state.thebe.notebooks[notebookId],
  (cells: CellState, notebook?: NotebookInfo) =>
    Object.entries(cells)
      .filter(([id, cell]) => notebook?.cells.indexOf(id) !== -1)
      .map(([id, cell]) => cell)
);

export const selectors = {
  getCellsForNotebook,
};

export default notebooks;
