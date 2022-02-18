import { combineReducers } from "@reduxjs/toolkit";
import servers from "./servers";
import kernels from "./kernels";
import notebooks from "./notebooks";
import config from "./config";
import cells from "./cells";

export const thebeReducer = combineReducers({
  config: config.reducer,
  servers: servers.reducer,
  kernels: kernels.reducer,
  cells: cells.reducer,
  notebooks: notebooks.reducer,
});

export const rootReducer = combineReducers({ thebe: thebeReducer });

export type State = ReturnType<typeof rootReducer>;
