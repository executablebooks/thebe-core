import { KernelSpecAPI, ServerConnection } from "@jupyterlab/services";
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BasicServerSettings } from "../types";
import { State } from "./types";

export enum ServerStatus {
  "launching" = "launching",
  "ready" = "server-ready",
  "closed" = "closed",
  "failed" = "failed",
  "unknown" = "unknown",
}

export interface ServerInfo {
  id: string;
  url: string;
  status: ServerStatus;
  message: string;
  settings: BasicServerSettings | null;
  specs: KernelSpecAPI.ISpecModels;
}

export type ServerState = Record<string, ServerInfo>;

const servers = createSlice({
  name: "servers",
  initialState: {} as ServerState,
  reducers: {
    opened: (
      state: ServerState,
      action: PayloadAction<{ id: string; url: string; message: string }>
    ) => {
      const { id, url, message } = action.payload;
      return {
        ...state,
        [id]: {
          id,
          url,
          status: ServerStatus.launching,
          settings: null,
          message,
          specs: { default: "", kernelspecs: {} },
        },
      };
    },
    message: (
      state: ServerState,
      action: PayloadAction<{
        id: string;
        status: ServerStatus;
        message: string;
      }>
    ) => {
      const { id, status, message } = action.payload;
      if (
        id in state &&
        state[id].status === status &&
        state[id].message === message
      )
        return state;

      if (!(status in ServerStatus)) {
        return {
          ...state,
          [id]: {
            ...state[id],
            status,
            message: `Unknown status ${status} - ${message}`,
          },
        };
      }

      return {
        ...state,
        [id]: { ...state[id], status, message },
      };
    },
    ready: (
      state: ServerState,
      action: PayloadAction<{
        id: string;
        settings: BasicServerSettings;
        message: string;
      }>
    ) => {
      const { id, settings, message } = action.payload;
      if (id in state && state[id].status === ServerStatus.ready) return state;
      return {
        ...state,
        [id]: {
          ...state[id],
          status: ServerStatus.ready,
          settings,
          message,
        },
      };
    },
    closed: (
      state: ServerState,
      action: PayloadAction<{ id: string; message: string }>
    ) => {
      const { id, message } = action.payload;
      if (id in state && state[id].status === ServerStatus.closed) return state;
      return {
        ...state,
        [id]: {
          ...state[id],
          status: ServerStatus.closed,
          settings: null,
          message,
        },
      };
    },
    reload: (state: ServerState, action: PayloadAction<ServerInfo>) => {
      const { id } = action.payload;
      return {
        ...state,
        [id]: { ...action.payload },
      };
    },
    error: (
      state: ServerState,
      action: PayloadAction<{ id: string; message: string }>
    ) => {
      const { id, message } = action.payload;
      if (id in state && state[id].status === ServerStatus.failed) return state;
      return {
        ...state,
        [id]: {
          ...state[id],
          status: ServerStatus.failed,
          settings: null,
          message,
        },
      };
    },
    updateSpecs: (
      state: ServerState,
      action: PayloadAction<{ id: string; specs: KernelSpecAPI.ISpecModels }>
    ) => {
      const { id, specs } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          specs,
        },
      };
    },
    clear: () => {
      return {};
    },
  },
});

const getKernelNames = createSelector(
  (state: State, serverId: string) => state.thebe.servers[serverId],
  (server?: ServerInfo) => Object.keys(server?.specs.kernelspecs ?? {})
);

const getDefaultKernelName = createSelector(
  (state: State, serverId: string) => state.thebe.servers[serverId],
  (server?: ServerInfo) => server?.specs.default ?? ""
);

export const selectors = {
  getDefaultKernelName,
  getKernelNames,
};

export default servers;
