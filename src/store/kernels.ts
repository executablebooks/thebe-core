import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum KernelStatus {
  "starting" = "starting",
  "ready" = "ready",
}

export interface KernelInfo {
  id: string;
  status: KernelStatus;
  server: string | null;
}

export type KernelsState = Record<string, KernelInfo>;

const kernels = createSlice({
  name: "kernels",
  initialState: {} as KernelsState,
  reducers: {
    start: (
      state: KernelsState,
      action: PayloadAction<{ id: string; name: string; server: string | null }>
    ) => {
      const { id, name, server } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          id,
          name,
          status: KernelStatus.starting,
          server,
        },
      };
    },
    ready: (state: KernelsState, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          status: KernelStatus.ready,
        },
      };
    },
    clear: () => {
      return {};
    },
  },
});

export default kernels;
