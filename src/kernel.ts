import { nanoid, Store, Unsubscribe } from "@reduxjs/toolkit";
import { ServerInfo, ServerStatus } from "./store/servers";
import { KernelOptions, Options, ThebeContext } from "./types";
import kernels from "./store/kernels";
import { KernelManager, ServerConnection } from "@jupyterlab/services";
import { IKernelConnection } from "@jupyterlab/services/lib/kernel/kernel";
import Server from "./server";
import { getContext } from "./context";

class ThebeKernel {
  id: string;
  ctx: ThebeContext;
  serverId?: string;

  // see https://github.dev/jupyterlab/jupyterlab/blob/d48e0c04efb786561137fb20773fc15788507f0a/packages/logconsole/src/widget.ts line 43
  connection?: IKernelConnection;
  _unsub?: Unsubscribe;

  constructor(id: string, serverId: string) {
    this.ctx = getContext();
    this.id = id;
    this.serverId = serverId;
  }

  unsubscribe() {
    if (this._unsub) {
      this._unsub();
      this._unsub = undefined;
    }
  }

  subscribeAndRequestKernelFromServer(server: Server, name: string) {
    if (server.isReady()) {
      return this.requestKernelFromServer(server, name);
    }
    this._unsub = this.ctx.store.subscribe(async () => {
      const state = this.ctx.store.getState();
      const kernelExists = state.thebe.kernels[this.id]!;
      if (server.isReady() && server.settings != null && !kernelExists) {
        this.requestKernelFromServer(server, name);
      }
    });
    return this;
  }

  async requestKernelFromServer(server: Server, name: string) {
    if (!server.settings) return this;
    console.debug(`Requesting Kernel from server ${server.id}`);
    await this.request(server, name);
    return this;
  }

  async request(server: Server, name: string): Promise<ThebeKernel> {
    const { settings } = server;
    if (settings == null) return this;
    this.ctx.store.dispatch(
      kernels.actions.start({ id: this.id, name, server: server.id })
    );
    let km = new KernelManager({
      serverSettings: ServerConnection.makeSettings(settings),
    });
    await km.ready;
    this.connection = await km.startNew({ name });
    this.ctx.kernels[this.id] = this;
    this.ctx.store.dispatch(kernels.actions.ready({ id: this.id }));
    return this;
  }

  async restart() {
    if (!this.connection) {
      console.error(`Trying to restart kernel with no connection`);
      return;
    }
    console.debug(`requesting restart for kernel ${this.id}`);
    await this.connection.restart();
  }
}

export default ThebeKernel;
