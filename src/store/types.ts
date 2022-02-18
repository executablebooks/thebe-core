import { CellState } from "./cells";
import { ConfigState } from "./config";
import { KernelsState } from "./kernels";
import { NotebookState } from "./notebooks";
import { ServerState } from "./servers";

export interface State {
  thebe: {
    config: ConfigState;
    servers: ServerState;
    kernels: KernelsState;
    notebooks: NotebookState;
    cells: CellState;
  };
}
