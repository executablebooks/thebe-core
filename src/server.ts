import {
  RequestServerSettings,
  RepoProvider,
  BasicServerSettings,
  Options,
  KernelOptions,
} from './types';
import { makeGitHubUrl, makeGitLabUrl, makeGitUrl } from './url';
import { nanoid } from 'nanoid';
import { getExistingServer, makeStorageKey, removeServerInfo, saveServerInfo } from './sessions';
import {
  KernelManager,
  KernelSpecAPI,
  ServerConnection,
  ServiceManager,
  SessionManager,
} from '@jupyterlab/services';
import ThebeSession from './session';

type LogCallback = ({ id, message }: { id: string; message: string }) => void;

class ThebeServer {
  id: string;
  sessionManager: SessionManager | undefined;
  _ready: Promise<void>;

  constructor(id: string, sessionManager: SessionManager) {
    this.id = id;
    this.sessionManager = sessionManager;
    this._ready = this.sessionManager.ready;
  }

  get ready() {
    return this._ready;
  }

  isReady(): boolean {
    return this.sessionManager?.isReady ?? false;
  }

  get settings() {
    return this.sessionManager?.serverSettings;
  }

  async requestSession(kernelOptions: Omit<KernelOptions, 'serverSettings'>) {
    if (!this.sessionManager)
      throw Error('Requesting session from a server, with no SessionManager available');
    const connection = await this.sessionManager?.startNew({
      name: kernelOptions.name,
      path: kernelOptions.path,
      type: 'notebook',
      kernel: {
        name: kernelOptions.kernelName ?? kernelOptions.name,
      },
    });
    return new ThebeSession(nanoid(), connection);
  }

  // TODO ThunkAction
  async fetchKernelNames() {
    if (!this.sessionManager) return { default: 'python', kernelSpecs: {} };
    return KernelSpecAPI.getSpecs(
      ServerConnection.makeSettings(this.sessionManager.serverSettings)
    );
  }

  async clear(options: Options) {
    const url = this.sessionManager?.serverSettings?.baseUrl;
    if (url)
      window.localStorage.removeItem(
        makeStorageKey(options.binderOptions.savedSession.storagePrefix, url)
      );
  }

  /**
   * Connect to a Jupyter server directly
   *
   */
  static async connectToJupyterServer(
    requestSettings: RequestServerSettings,
    log?: LogCallback
  ): Promise<ThebeServer> {
    const id = nanoid();
    const serverSettings = ServerConnection.makeSettings(requestSettings);
    console.debug('thebe:api:connectToJupyterServer:serverSettings:', serverSettings);

    let kernelManager = new KernelManager({ serverSettings });
    log?.({
      id,
      message: `Created KernelManager: ${requestSettings.baseUrl}`,
    });

    const sessionManager = new SessionManager({ kernelManager });
    log?.({
      id,
      message: `Created SessionMananger: ${serverSettings.baseUrl}`,
    });

    return new ThebeServer(id, sessionManager);
  }

  /**
   * Connect to Jupyterlite Server
   *
   */
  static async connectToJupyterLiteServer(
    serviceManager: ServiceManager,
    log?: LogCallback
  ): Promise<ThebeServer> {
    const id = nanoid();
    console.debug(
      'thebe:api:connectToJupyterLiteServer:serverSettings:',
      serviceManager.serverSettings
    );

    const sessionManager = serviceManager.sessions;
    log?.({
      id,
      message: `Received SessionMananger from JupyterLite`,
    });

    // const connection = await sessionManager.startNew({
    //   name: 'python',
    //   path: 'any.ipynb',
    //   type: 'notebook',
    //   kernel: {
    //     name: 'python',
    //   },
    // });
    // const future = connection.kernel!.requestExecute({ code: 'print("Hello World")' });

    // console.log('future', future);
    // future.onReply = (reply: any) => {
    //   console.log(`Got execute reply with status ${JSON.stringify(reply.content, null, 2)}`);
    // };
    // future.onIOPub = (reply: any) => {
    //   console.log(reply);
    // };
    // await future.done;
    // console.log('future done');

    return new ThebeServer(id, sessionManager);
  }

  /**
   * Connect to a Binder instance in order to
   * access a Jupyter server that can provide kernels
   *
   * @param ctx
   * @param opts
   * @returns
   */
  static async connectToServerViaBinder(options: Options, log?: LogCallback): Promise<ThebeServer> {
    const { binderOptions } = options;
    console.debug('thebe:server:connectToServerViaBinder binderUrl:', binderOptions.binderUrl);

    let url: string;
    switch (binderOptions.repoProvider) {
      case RepoProvider.git:
        url = makeGitUrl(binderOptions);
        break;
      case RepoProvider.gitlab:
        url = makeGitLabUrl(binderOptions);
        break;
      case RepoProvider.github:
      default:
        url = makeGitHubUrl(binderOptions);
        break;
    }
    console.debug('thebe:server:connectToServerViaBinder Binder build URL:', url);

    if (binderOptions.savedSession.enabled) {
      console.debug('thebe:server:connectToServerViaBinder Checking for saved session...');
      const existing = await getExistingServer(binderOptions, url);
      if (existing) {
        const { id, settings } = existing;
        if (settings) {
          let kernelManager = new KernelManager({
            serverSettings: ServerConnection.makeSettings(settings),
          });
          const sessionManager = new SessionManager({ kernelManager });
          return new ThebeServer(existing.id, sessionManager);
        }
      }
    }

    // request new server
    const id = nanoid();

    return new Promise((resolve, reject) => {
      // Talk to the binder server
      const es = new EventSource(url);
      log?.({ id, message: `Opened connection to binder: ${url}` });

      // handle errors
      es.onerror = (evt: Event) => {
        console.error(`Lost connection to binder: ${url}`, evt);
        es?.close();
        log?.({ id, message: (evt as MessageEvent)?.data });
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
            log?.({ id, message: `Binder: failed to build - ${url} - ${msg.message}` });
            break;
          case 'ready': {
            es?.close();

            const settings: BasicServerSettings = {
              baseUrl: msg.url,
              wsUrl: 'ws' + msg.url.slice(4),
              token: msg.token,
              appendToken: true,
            };

            let kernelManager = new KernelManager({
              serverSettings: ServerConnection.makeSettings(settings),
            });
            const sessionManager = new SessionManager({ kernelManager });

            log?.({ id, message: `Server from Binder is ready: ${msg.message}` });

            if (binderOptions.savedSession.enabled) {
              saveServerInfo(binderOptions.savedSession, url, settings);
              console.debug(
                `thebe:server:connectToServerViaBinder Saved session for ${id} at ${url}`
              );
            }

            resolve(new ThebeServer(id, sessionManager));
          }
          default:
            log?.({
              id,
              message: `Binder is: ${phase} - ${msg.message}`,
            });
        }
      };
    });
  }
}

export default ThebeServer;
