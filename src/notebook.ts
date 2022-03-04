import { nanoid } from "nanoid";
import CellRenderer from "./renderer";
import { getContext } from "./context";
import ThebeKernel from "./kernel";
import { ThebeManager } from "./manager";
import { actions } from "./store";
import notebooks from "./store/notebooks";
import { JsonObject, MathjaxOptions, Options, ThebeContext } from "./types";

export interface CodeBlock {
  id: string;
  source: string;
  [x: string]: any;
}

class Notebook {
  id: string;
  ctx: ThebeContext;
  cells?: CellRenderer[];

  static fromCodeBlocks(blocks: CodeBlock[]) {
    const ctx = getContext();
    const id = nanoid();
    ctx.store.dispatch(
      notebooks.actions.setup({
        id,
        cells: blocks.map(({ id }) => id),
      })
    );

    const notebook = new Notebook(id);
    ctx.notebooks[id] = notebook;
    notebook.cells = blocks.map((c) => {
      ctx.store.dispatch(actions.cells.add({ id: c.id, source: c.source }));
      const cell = new CellRenderer(ctx, c.id, id);
      console.debug(`thebe:notebook:fromCodeBlocks Initializing cell ${c.id}`);
      return cell;
    });

    return notebook;
  }

  constructor(id: string) {
    this.ctx = getContext();
    this.id = id;
  }

  numCells() {
    return this.cells?.length ?? 0;
  }

  getCell(idx: number) {
    if (!this.cells) throw Error("Dag not initialized");
    if (idx >= this.cells.length)
      throw Error(
        `Notebook.cells index out of range: ${idx}:${this.cells.length}`
      );
    return this.cells[idx];
  }

  getCellById(id: string) {
    const cell = this.cells?.find((cell: CellRenderer) => cell.id === id);
    return cell;
  }

  lastCell() {
    if (!this.cells) throw Error("Notebook not initialized");
    return this.cells[this.cells.length - 1];
  }

  attachKernel(kernel: ThebeKernel) {
    if (!kernel.connection) return;
    // TODO some tyeof redux.config hookup for
    const cdnOnly = true;
    const manager = new ThebeManager(kernel.connection, cdnOnly);
    this.cells?.map((cell) => cell.attachKernel(kernel.id, manager));
  }

  detachKernel() {
    this.cells?.map((cell) => cell.detachKernel());
  }

  async executeUpTo(
    kernelId: string,
    cellId: string,
    preprocessor?: (s: string) => string
  ) {
    if (!this.cells) return null;
    const idx = this.cells.findIndex((c) => c.id === cellId);
    if (idx === -1) return null;
    const cellsToExecute = this.cells.slice(0, idx + 1);
    cellsToExecute.map((cell) => cell.renderBusy(true));
    const state = this.ctx.store.getState();
    let result = null;
    for (let cell of cellsToExecute) {
      console.debug(`Executing cell ${cell.id}`);
      const { source } = state.thebe.cells[cell.id];
      result = await cell?.execute(
        kernelId,
        preprocessor ? preprocessor(source) : source
      );
      if (!result) {
        console.error(`Error executing cell ${cell.id}`);
        return null;
      }
    }
    return result;
  }

  async executeOnly(
    kernelId: string,
    cellId: string,
    preprocessor?: (s: string) => string
  ) {
    if (!this.cells) return null;
    return this.executeCells([cellId], kernelId, preprocessor);
  }

  async executeCells(
    cellIds: string[],
    kernelId: string,
    preprocessor?: (s: string) => string
  ): Promise<{
    height: number;
    width: number;
  } | null> {
    if (!this.cells) return null;
    const cells = this.cells.filter((c) => {
      const found = cellIds.find((id) => id === c.id);
      if (!found) {
        console.warn(`Cell ${c.id} not found in notebook`);
      }
      return Boolean(found);
    });

    const state = this.ctx.store.getState();
    let result = null;
    for (let cell of cells) {
      const { source } = state.thebe.cells[cell.id];
      result = await cell.execute(
        kernelId,
        preprocessor ? preprocessor(source) : source
      );
      if (!result) {
        console.error(`Error executing cell ${cell.id}`);
        return null;
      }
    }
    return result;
  }

  async executeAll(
    kernelId: string,
    preprocessor?: (s: string) => string
  ): Promise<{
    height: number;
    width: number;
  } | null> {
    if (!this.cells) return null;
    this.cells.map((cell) => cell.renderBusy(true));
    const state = this.ctx.store.getState();
    let result = null;
    for (let cell of this.cells) {
      const { source } = state.thebe.cells[cell.id];
      result = await cell.execute(
        kernelId,
        preprocessor ? preprocessor(source) : source
      );
      if (!result) {
        console.error(`Error executing cell ${cell.id}`);
        return null;
      }
    }
    return result;
  }
}

export default Notebook;
