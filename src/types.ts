import { EnhancedStore } from '@reduxjs/toolkit';
import ThebeSession from './session';
import ThebeNotebook from './notebook';
import ThebeServer from './server';
import { KernelSpecAPI } from '@jupyterlab/services';
import type { ServerStatus } from './messaging';

export type JsonObject = Record<string, any>;

export interface ServerInfo {
  id: string;
  url: string;
  status: ServerStatus;
  message: string;
  settings: BasicServerSettings | null;
  specs: KernelSpecAPI.ISpecModels;
}

export interface ThebeContext {
  servers: Record<string, ThebeServer>;
  kernels: Record<string, ThebeSession>;
  notebooks: Record<string, ThebeNotebook>;
}

export interface Options {
  mathjaxUrl?: string;
  mathjaxConfig?: string;
  useBinder: boolean;
  useJupyterLite: boolean;
  requestSession: boolean;
  binderOptions: BinderOptions;
  kernelOptions: SessionOptions;
}

export enum RepoProvider {
  'git' = 'git',
  'github' = 'github',
  'gitlab' = 'gitlab',
  'gist' = 'gist',
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

export interface SessionOptions {
  name: string;
  kernelName: string;
  path: string;
  serverSettings: RequestServerSettings;
}
