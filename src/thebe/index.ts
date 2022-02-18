/**
 * thebe/index.js is the entrypoint for the webpack build and will
 * be invoked on module load, seting up context with an independent store
 * and adding to the window object.
 */
import { setupThebeCore } from "../context";
import ThebeKernel from "../kernel";
import Notebook, { CodeBlock } from "../notebook";
import { Options, ThebeContext } from "../types";
import {
  clear,
  connect,
  connectToBinder,
  connectToJupyter,
  restartKernel,
  setupNotebook,
} from "./api";
import "../index.css";
import { configure } from "../options";

export interface JsApi {
  configure: (options: Partial<Options>) => void;
  connect: (options: Partial<Options>) => Promise<ThebeKernel>;
  binder: (options: Partial<Options>) => Promise<ThebeKernel>;
  jupyter: (options: Partial<Options>) => Promise<ThebeKernel>;
  setupNotebook: (blocks: CodeBlock[]) => Notebook;
  restartKernel: (kernelId: string) => void;
  clear: () => void;
}

declare global {
  interface Window {
    thebeCore: {
      ctx: ThebeContext;
      api?: JsApi;
    };
  }
}

window.thebeCore = {
  ...window.thebeCore,
  ctx: setupThebeCore(),
  api: {
    configure,
    connect,
    binder: connectToBinder,
    jupyter: connectToJupyter,
    setupNotebook,
    restartKernel,
    clear,
  },
};
