import { ServerConnection } from "@jupyterlab/services";
import { getContext } from "./context";
import {
  RequestServerSettings,
  BinderOptions,
  KernelOptions,
  Options,
  RepoProvider,
  ThebeContext,
} from "./types";
import { actions } from "./store";

const DEFAULT_BINDER_OPTIONS: BinderOptions = {
  repo: "binder-examples/requirements",
  ref: "master",
  binderUrl: "https://mybinder.org",
  repoProvider: RepoProvider.github,
  savedSession: {
    enabled: true,
    maxAge: 86400,
    storagePrefix: "thebe-binder-",
  },
};

export function ensureBinderOptions(options: Partial<BinderOptions>) {
  return {
    ...DEFAULT_BINDER_OPTIONS,
    ...options,
    savedSession: {
      ...DEFAULT_BINDER_OPTIONS.savedSession,
      ...options?.savedSession,
    },
  };
}

const DEFAULT_KERNEL_OPTIONS: KernelOptions = {
  path: "/",
  name: "python3",
  kernelName: "python3",
  serverSettings: {
    baseUrl: "http://localhost:8888",
    token: "test-secret",
    appendToken: true,
  } as RequestServerSettings,
};

export function ensureKernelOptions(options: Partial<KernelOptions>) {
  return {
    ...DEFAULT_KERNEL_OPTIONS,
    ...options,
    serverSettings: {
      ...DEFAULT_KERNEL_OPTIONS.serverSettings,
      ...options.serverSettings,
    },
  };
}

export function ensureOptions(options: Partial<Options>): Options {
  const binderOptions = ensureBinderOptions(options.binderOptions ?? {});
  const kernelOptions = ensureKernelOptions(options.kernelOptions ?? {});

  return {
    useBinder: true,
    useJupyterLite: false,
    requestKernel: true,
    ...options,
    binderOptions,
    kernelOptions,
  };
}

export function configure(options: Partial<Options>) {
  const opts = ensureOptions(options);
  const ctx = getContext();
  ctx.store.dispatch(
    actions.config.update({
      config: {
        mathjax: {
          url: opts.mathjaxUrl,
          config: opts.mathjaxConfig,
        },
        sessionSaving: opts.binderOptions?.savedSession,
      },
    })
  );
  return opts;
}
