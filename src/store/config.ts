import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SavedSessionOptions, MathjaxOptions } from "../types";
import { State } from "./types";

export type ConfigState = {
  sessionSaving: SavedSessionOptions;
  mathjax: MathjaxOptions;
};

const config = createSlice({
  name: "config",
  initialState: {
    sessionSaving: {
      enabled: true,
      maxAge: 86400,
      storagePrefix: "thebe-binder-",
    },
    mathjax: {},
  } as ConfigState,
  reducers: {
    update: (
      state: ConfigState,
      action: PayloadAction<{ config: Partial<ConfigState> }>
    ) => {
      const { config } = action.payload;
      if (config === state) return state;
      return { ...state, ...config };
    },
  },
});

function selectMathjaxConfig(state: State) {
  return state.thebe.config.mathjax;
}

export const selectors = {
  selectMathjaxConfig,
};

export default config;
