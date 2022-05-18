import {
  RequestServerSettings,
  RepoProvider,
  ThebeContext,
  BasicServerSettings,
  BinderRequestOptions,
} from './types';
import { makeGitHubUrl, makeGitLabUrl, makeGitUrl } from './url';
import servers, { ServerInfo, ServerStatus } from './store/servers';
import { nanoid } from 'nanoid';

import { getExistingServer, removeServerInfo, saveServerInfo } from './sessions';
import kernels from './store/kernels';
import { KernelManager, KernelSpecAPI, ServerConnection } from '@jupyterlab/services';
import { ensureBinderOptions } from './options';
import { getContext } from './context';
import { actions } from './store';

class Server {
  id: string;
  ctx: ThebeContext;
  es: EventSource | null;

  constructor(ctx: ThebeContext, id: string) {
    this.id = id;
    this.ctx = ctx;
    this.es = null;
  }

  // TODO Selectors

  get(): ServerInfo {
    return this.ctx.store.getState().thebe.servers[this.id];
  }

  isReady(): boolean {
    return this.get().status === ServerStatus.ready;
  }

  get settings() {
    return this.get().settings;
  }

  // TODO ThunkAction
  static async fetchKernelNames(serverId: string) {
    const ctx = getContext();
    const state = ctx.store.getState();

    const server = state.thebe.servers[serverId];
    if (!server.settings) throw Error('No server settings cannot fetchKernelNames');
    const specs = await KernelSpecAPI.getSpecs(ServerConnection.makeSettings(server.settings));
    ctx.store.dispatch(actions.servers.updateSpecs({ id: serverId, specs: specs }));
  }

  // TODO ThunkAction
  static async clearAllServers() {
    const ctx = getContext();
    const state = ctx.store.getState();
    Object.keys(state.thebe.servers).map((id: string) => removeServerInfo(ctx, id));
    ctx.store.dispatch(servers.actions.clear());
    ctx.store.dispatch(kernels.actions.clear());
  }

  // TODO ThunkAction
  /**
   * Connect to a Jupyter server directly
   *
   * @param ctx
   * @param opts
   * @returns
   */
  static async connectToServer(requestSettings: RequestServerSettings): Promise<Server> {
    const ctx = getContext();
    const { dispatch } = ctx.store;
    const id = nanoid();
    try {
      const serverSettings = ServerConnection.makeSettings(requestSettings);
      console.debug('thebe:api:connectToServer:serverSettings:', serverSettings);
      let km = new KernelManager({ serverSettings });
      dispatch(
        servers.actions.opened({
          id,
          url: requestSettings.baseUrl,
          message: `Requesting direct server connection to ${requestSettings.baseUrl}`,
        })
      );
      await km.ready;

      const { baseUrl, wsUrl, token, appendToken } = serverSettings;
      ctx.store.dispatch(
        servers.actions.ready({
          id,
          settings: { baseUrl, wsUrl, token, appendToken },
          message: `Server is ready: ${baseUrl}`,
        })
      );
    } catch (err) {}

    return new Server(ctx, id);
  }

  // TODO ThunkAction
  /**
   * Connect to a Binder instance in order to
   * access a Jupyter server that can provide kernels
   *
   * @param ctx
   * @param opts
   * @returns
   */
  static async connectToServerViaBinder(options: Partial<BinderRequestOptions>): Promise<Server> {
    const ctx = getContext();
    const state = ctx.store.getState();
    const { sessionSaving } = state.thebe.config;
    const opts = ensureBinderOptions(options);
    console.debug('thebe:server:connectToServerViaBinder binderUrl:', opts.binderUrl);

    let url: string;
    switch (opts.repoProvider) {
      case RepoProvider.git:
        url = makeGitUrl(opts);
        break;
      case RepoProvider.gitlab:
        url = makeGitLabUrl(opts);
        break;
      case RepoProvider.github:
      default:
        url = makeGitHubUrl(opts);
        break;
    }
    console.debug('thebe:server:connectToServerViaBinder Binder build URL:', url);

    if (sessionSaving.enabled) {
      console.debug('thebe:server:connectToServerViaBinder Checking for saved session...');
      const existing = await getExistingServer(ctx, url);
      if (existing) return new Server(ctx, existing.id);
    }

    // request new server
    const id = nanoid();

    // Talk to the binder server
    const es = new EventSource(url);
    ctx.store.dispatch(
      servers.actions.opened({
        id,
        url,
        message: `Opened connection to binder: ${url}`,
      })
    );

    // handle errors
    es.onerror = (evt: Event) => {
      console.error(`Lost connection to binder: ${url}`, evt);
      es?.close();
      ctx.store.dispatch(
        servers.actions.error({
          id,
          message: (evt as MessageEvent)?.data,
        })
      );
    };

    es.onmessage = async (evt: MessageEvent<string>) => {
      const msg: {
        // TODO must be in Jupyterlab types somewhere
        phase: string;
        message: string;
        url: string;
        token: string;
      } = JSON.parse(evt.data);

      const phase = msg.phase?.toLowerCase() ?? '';
      switch (phase) {
        case 'failed':
          es?.close();
          ctx.store.dispatch(
            servers.actions.error({
              id,
              message: `Binder: failed to build - ${url} - ${msg.message}`,
            })
          );
          break;
        case 'ready':
          es?.close();

          const settings: BasicServerSettings = {
            baseUrl: msg.url,
            wsUrl: 'ws' + msg.url.slice(4),
            token: msg.token,
            appendToken: true,
          };

          ctx.store.dispatch(
            servers.actions.ready({
              id,
              settings,
              message: `Server from Binder is ready: ${msg.message}`,
            })
          );

          if (sessionSaving.enabled) {
            saveServerInfo(ctx, id);
            console.debug(
              `thebe:server:connectToServerViaBinder Saved session for ${id} at ${url}`
            );
          }
          break;
        default:
          ctx.store.dispatch(
            servers.actions.message({
              id,
              status: ServerStatus.launching,
              message: `Binder is: ${phase} - ${msg.message}`,
            })
          );
      }
    };

    return new Server(ctx, id);
  }
}

export default Server;
