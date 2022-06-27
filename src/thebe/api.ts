import ThebeServer from '../server';
import ThebeSession from '../session';
import ThebeNotebook, { CodeBlock } from '../notebook';
import { MathjaxOptions, Options } from '../types';
import { ensureOptions } from '../options';
import { startJupyterLiteServer } from '../jlite';

export async function connect(
  options: Partial<Options>
): Promise<{ server: ThebeServer; session?: ThebeSession }> {
  const opts = ensureOptions(options);
  let server: ThebeServer;
  if (options.useBinder) {
    console.debug(`thebe:api:connect useBinder`, options);
    server = await ThebeServer.connectToServerViaBinder(opts);
  } else if (options.useJupyterLite) {
    console.debug(`thebe:api:connect JupyterLite`, options);
    const serviceManager = await startJupyterLiteServer();
    server = await ThebeServer.connectToJupyterLiteServer(serviceManager);
  } else {
    server = await ThebeServer.connectToJupyterServer(opts.kernelOptions.serverSettings);
  }

  await server.ready;

  if (options.requestSession) {
    const session = await server.requestSession({
      name: 'python',
      path: 'any.ipynb',
      kernelName: 'python',
    });
    return { server, session };
  }

  return { server };
}

export function setupNotebook(blocks: CodeBlock[], options: Partial<Options>) {
  const { mathjaxUrl, mathjaxConfig } = ensureOptions(options);
  return ThebeNotebook.fromCodeBlocks(blocks, { url: mathjaxUrl, config: mathjaxConfig });
}
