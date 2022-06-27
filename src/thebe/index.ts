/**
 * thebe/index.js is the entrypoint for the webpack build and will
 * be invoked on module load, seting up context with an independent store
 * and adding to the window object.
 */
import ThebeServer from '../server';
import ThebeSession from '../session';
import ThebeNotebook, { CodeBlock } from '../notebook';
import { Options, ThebeContext } from '../types';
import { connect, setupNotebook } from './api';

import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyter-widgets/controls/css/widgets-base.css';
import '@lumino/widgets/style/index.css';
import '@jupyterlab/apputils/style/base.css';
import '@jupyterlab/rendermime/style/base.css';
import 'font-awesome/css/font-awesome.css';
import '../index.css';

export interface JsApi {
  connect: (options: Partial<Options>) => Promise<{ server: ThebeServer; session?: ThebeSession }>;
  setupNotebook: (blocks: CodeBlock[], options: Partial<Options>) => ThebeNotebook;
}

declare global {
  interface Window {
    define: any;
    requirejs: any;
    thebeCore: {
      api: JsApi;
    };
  }
}

window.thebeCore = {
  ...window.thebeCore,
  api: {
    connect,
    setupNotebook,
  },
};
