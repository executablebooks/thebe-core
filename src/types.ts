import { EnhancedStore } from "@reduxjs/toolkit";
import CellRenderer from "./renderer";
import ThebeKernel from "./kernel";
import Notebook from "./notebook";
import { State } from "./store";

export type JsonObject = Record<string, any>;

export interface ThebeContext {
  store: EnhancedStore<State>;
  kernels: Record<string, ThebeKernel>;
  notebooks: Record<string, Notebook>;
}

export interface Options {
  mathjaxUrl?: string;
  mathjaxConfig?: string;
  useBinder: boolean;
  requestKernel: boolean;
  binderOptions: BinderOptions;
  kernelOptions: KernelOptions;
}

export enum RepoProvider {
  "git" = "git",
  "github" = "github",
  "gitlab" = "gitlab",
}

export interface MathjaxOptions {
  url?: string;
  config?: string;
}

export interface SavedSessionOptions {
  enabled: true;
  maxAge: number;
  storagePrefix: string;
}

export interface BinderRequestOptions {
  repo: string;
  ref: string;
  binderUrl: string;
  repoProvider: RepoProvider;
}

export type BinderOptions = BinderRequestOptions & {
  savedSession: SavedSessionOptions;
};

export interface RequestServerSettings {
  baseUrl: string;
  token: string;
  appendToken: boolean;
}

export type BasicServerSettings = RequestServerSettings & {
  wsUrl: string;
};

export interface KernelOptions {
  name: string;
  kernelName: string;
  path: string;
  serverSettings: RequestServerSettings;
}
