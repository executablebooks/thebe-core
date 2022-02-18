import { KernelAPI, ServerConnection } from "@jupyterlab/services";
import servers, { ServerInfo } from "./store/servers";
import { SavedSessionOptions, ThebeContext } from "./types";

function makeStorageKey(storagePrefix: string, url: string) {
  return storagePrefix + url;
}

export function removeServerInfo(ctx: ThebeContext, serverId: string) {
  const state = ctx.store.getState();
  const { sessionSaving } = state.thebe.config;
  const { url } = state.thebe.servers[serverId];
  window.localStorage.removeItem(
    makeStorageKey(sessionSaving.storagePrefix, url)
  );
}

export function updateLastUsedTimestamp(ctx: ThebeContext, serverId: string) {
  const state = ctx.store.getState();
  const { sessionSaving } = state.thebe.config;
  const server = state.thebe.servers[serverId];
  if (!server) return;
  const storageKey = makeStorageKey(sessionSaving.storagePrefix, server.url);
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return;
  const obj = JSON.parse(saved);
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ ...obj, lastUsed: new Date() })
  );
}

export function saveServerInfo(ctx: ThebeContext, serverId: string) {
  const state = ctx.store.getState();
  const { sessionSaving } = state.thebe.config;
  const server = state.thebe.servers[serverId];
  try {
    // save the current connection url+token to reuse later
    window.localStorage.setItem(
      makeStorageKey(sessionSaving.storagePrefix, server.url),
      JSON.stringify({
        ...server,
        lastUsed: new Date(),
      })
    );
  } catch (e) {
    // storage quota full, gently ignore nonfatal error
    console.warn(
      "Couldn't save thebe binder connection info to local storage",
      e
    );
  }
}

export async function getExistingServer(
  ctx: ThebeContext,
  url: string
): Promise<ServerInfo | null> {
  const state = ctx.store.getState();
  const { sessionSaving } = state.thebe.config;
  if (!sessionSaving.enabled) return null;
  const storageKey = makeStorageKey(sessionSaving.storagePrefix, url);
  let storedInfoJSON = window.localStorage.getItem(storageKey);
  if (storedInfoJSON == null) {
    console.debug("thebe:getExistingServer No session saved in ", storageKey);
    return null;
  }

  console.debug("thebe:getExistingServer Saved binder session detected");
  let existingServer = JSON.parse(storedInfoJSON ?? "");
  let lastUsed = new Date(existingServer.lastUsed);
  const now = new Date();
  let ageSeconds = (now.getTime() - lastUsed.getTime()) / 1000;
  if (ageSeconds > sessionSaving.maxAge) {
    console.debug(
      `thebe:getExistingServer Not using expired binder session for ${existingServer.url} from ${lastUsed}`
    );
    window.localStorage.removeItem(storageKey);
    return null;
  }

  try {
    await KernelAPI.listRunning(
      ServerConnection.makeSettings(existingServer.settings)
    );
  } catch (err) {
    console.debug(
      "thebe:getExistingServer Saved binder connection appears to be invalid, requesting new session",
      err
    );
    window.localStorage.removeItem(storageKey);
    return null;
  }

  // refresh lastUsed timestamp in stored info
  ctx.store.dispatch(servers.actions.reload(existingServer));
  updateLastUsedTimestamp(ctx, existingServer.id);
  console.debug(
    `thebe:getExistingServer Saved binder session is valid, reusing connection to ${existingServer.url}`
  );

  return existingServer;
}
