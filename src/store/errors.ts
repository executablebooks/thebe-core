import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum ErrorFrom {
  "cell" = "cell",
  "kernel" = "kernel",
  "server" = "server",
}

export interface ErrorItem {
  from: ErrorFrom;
  id: string;
  message: string;
}

export type ErrorsState = {
  log: ErrorItem[];
  last?: ErrorItem;
};

function reduceFrom(
  from: ErrorFrom,
  state: ErrorsState,
  action: PayloadAction<{ id: string; message: string }>
) {
  const { id, message } = action.payload;
  return {
    ...state,
    log: [{ from, id, message }, ...state.log.slice(0, 49)],
  };
}

const errors = createSlice({
  name: "errors",
  initialState: {
    log: [],
  } as ErrorsState,
  reducers: {
    cell: (
      state: ErrorsState,
      action: PayloadAction<{ id: string; message: string }>
    ) => reduceFrom(ErrorFrom.cell, state, action),
    kernel: (
      state: ErrorsState,
      action: PayloadAction<{ id: string; message: string }>
    ) => reduceFrom(ErrorFrom.kernel, state, action),
    server: (
      state: ErrorsState,
      action: PayloadAction<{ id: string; message: string }>
    ) => reduceFrom(ErrorFrom.server, state, action),
  },
});

export default errors;
