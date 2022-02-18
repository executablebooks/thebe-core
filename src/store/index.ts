import { configureStore } from "@reduxjs/toolkit";
import { logger } from "./middleware";
import { rootReducer } from "./reducers";

export * from "./reducers";
export * from "./actions";
export * from "./selectors";
export { ServerInfo, ServerStatus } from "./servers";
export { KernelInfo, KernelStatus } from "./kernels";

export function setupStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  });
}
