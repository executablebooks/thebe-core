import Server from "../server";
import ThebeKernel from "../kernel";
import Notebook, { CodeBlock } from "../notebook";
import { Options } from "../types";
import { ensureOptions } from "../options";
import { nanoid } from "nanoid";
import { getContext } from "../context";
import { startJupyterLiteServer } from "../jlite";

export function connect(options: Partial<Options>): Promise<ThebeKernel> {
  if (options.useBinder) return connectToBinder(options);
  if (options.useJupyterLite) return connectToJupyterLite(options);
  return connectToJupyter(options);
}

export async function connectToBinder(
  options: Partial<Options>
): Promise<ThebeKernel> {
  const opts = ensureOptions(options);
  const server = await Server.connectToServerViaBinder(opts.binderOptions);
  const kernel = new ThebeKernel(nanoid(), server.id);
  return kernel.subscribeAndRequestKernelFromServer(
    server,
    opts.kernelOptions.name
  );
}

export async function connectToJupyterLite(
  options: Partial<Options>
): Promise<ThebeKernel> {
  const opts = ensureOptions(options);
  await startJupyterLiteServer();
  const baseUrl = `${location.protocol}//${location.host}`;
  console.debug(`thebe:api:connectToJupyterLite:baseUrl: ${baseUrl}`);
  const server = await Server.connectToServer({
    baseUrl,
    token: "",
    appendToken: false,
  });
  const kernel = new ThebeKernel(nanoid(), server.id);
  return kernel.subscribeAndRequestKernelFromServer(server, "Pyolite");
}

export async function connectToJupyter(
  options: Partial<Options>
): Promise<ThebeKernel> {
  const opts = ensureOptions(options);
  const server = await Server.connectToServer(
    opts.kernelOptions.serverSettings
  );
  const kernel = new ThebeKernel(nanoid(), server.id);
  return kernel.subscribeAndRequestKernelFromServer(
    server,
    opts.kernelOptions.name
  );
}

export function setupNotebook(blocks: CodeBlock[]) {
  return Notebook.fromCodeBlocks(blocks);
}

export async function restartKernel(kernelId: string) {
  const ctx = getContext();
  if (kernelId in ctx.kernels) {
    await ctx.kernels[kernelId].restart();
  } else {
    console.debug(`thebe:api:restartKernel could not find kernel ${kernelId}`);
  }
}

export function clear() {
  Server.clearAllServers();
}
