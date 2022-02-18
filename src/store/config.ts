import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SavedSessionOptions, MathjaxOptions } from "../types";
import merge from "lodash.merge";

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
      return merge(state, config);
    },
  },
});

export default config;
