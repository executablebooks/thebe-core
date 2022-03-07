import servers from "./servers";
import kernels from "./kernels";
import notebooks, { thunks as notebookThunks } from "./notebooks";
import config from "./config";
import cells from "./cells";
import errors from "./errors";

const actions = {
  config: config.actions,
  servers: servers.actions,
  kernels: kernels.actions,
  notebooks: notebooks.actions,
  cells: cells.actions,
  errors: errors.actions,
  thunks: {
    notebooks: notebookThunks,
  },
};

export default actions;
