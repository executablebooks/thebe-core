import { Store } from '@reduxjs/toolkit';
import { JsApi } from './thebe';
import { ThebeContext } from './types';

// let context: ThebeContext | null = null;

// declare global {
//   interface Window {
//     thebeCore: {
//       api?: JsApi;
//     };
//   }
// }

// export function setupThebeCore(store?: Store, addToWindow = false): ThebeContext {
//   context = {
//     store: store ? store : setupStore(),
//     servers: {},
//     kernels: {},
//     notebooks: {},
//   };

//   if (addToWindow) {
//     window.thebeCore = { ctx: context };
//   }

//   return context as ThebeContext;
// }

// export function getContext(): ThebeContext {
//   if (context == null) throw Error('thebe-core context is null, call setupThebeCore first.');
//   return context;
// }
