import {
  createSelector,
  createSlice,
  PayloadAction,
  ThunkAction,
  AnyAction,
} from "@reduxjs/toolkit";
import { getContext } from "../context";
import { KernelStatus } from ".";
import { CellState } from "./cells";
import { State } from "./types";
import Notebook from "../notebook";

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

const hookupKernel =
  (
    notebookId: string,
    kernelId: string
  ): ThunkAction<void, State, unknown, AnyAction> =>
  (dispatch, getState) => {
    const kernelInfo = getState().thebe.kernels[kernelId];
    if (kernelInfo.status !== KernelStatus.ready) {
      console.warn(
        `Kernel ${kernelId} is not ready, cannot hookup notebook ${notebookId}`
      );
      return;
    }
    const ctx = getContext();
    const kernel = ctx.kernels[kernelId];
    if (!kernel) {
      console.warn(`kernel ${kernelId} not found in context`);
      return;
    }
    const notebook: Notebook = ctx.notebooks[notebookId];
    console.log("hookupKernel", notebook, kernel);
    notebook.hookup(kernel);
    // consider storing current active kernelId on the notebook info
    // e.g. dispatch(notebooks.actions.setActiveKernelId(notebookId, kernelId));
  };

const executeCells =
  (
    notebookId: string,
    kernelId: string,
    cellIds: string[]
  ): ThunkAction<void, State, unknown, AnyAction> =>
  async () => {
    const ctx = getContext();
    const notebook = ctx.notebooks[notebookId];
    if (!notebook) {
      console.warn(`notebook ${notebookId} not found in context`);
      return;
    }
    // TODO refactor - the cell should be attached to a kernel via the manager
    notebook.executeCells(cellIds, kernelId);
  };

const executeAll =
  (
    notebookId: string,
    kernelId: string
  ): ThunkAction<void, State, unknown, AnyAction> =>
  () => {
    const ctx = getContext();
    const notebook: Notebook = ctx.notebooks[notebookId];
    if (!notebook) {
      console.warn(`kernel ${notebookId} not found in context`);
      return;
    }
    // TODO refactor - the cell should be attached to a kernel via the manager
    notebook.executeAll(kernelId);
  };

export const thunks = {
  executeCells,
  executeAll,
  hookupKernel,
};

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
