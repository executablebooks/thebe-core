import { JupyterLiteServer } from '@jupyterlite/server';

const serverExtensions = [
  import('@jupyterlite/pyolite-kernel-extension'),
  import('@jupyterlite/server-extension'),
];

export async function startJupyterLiteServer() {
  const litePluginsToRegister: JupyterLiteServer.IPluginModule[] = [];

  /**
   * Iterate over active plugins in an extension.
   */
  function* activePlugins(extension: any) {
    // Handle commonjs or es2015 modules
    let exports;
    if (extension.hasOwnProperty('__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }

    let plugins = Array.isArray(exports) ? exports : [exports];
    for (let plugin of plugins) {
      yield plugin;
    }
  }

  // Add the base serverlite extensions
  const baseServerExtensions = await Promise.all(serverExtensions);
  baseServerExtensions.forEach((p) => {
    for (let plugin of activePlugins(p)) {
      litePluginsToRegister.push(plugin);
    }
  });

  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new JupyterLiteServer({} as any);
  jupyterLiteServer.registerPluginModules(litePluginsToRegister);
  // start the server
  await jupyterLiteServer.start();

  const { serviceManager } = jupyterLiteServer;
  await serviceManager.ready;

  return serviceManager;
}
