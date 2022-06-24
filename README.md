# thebe-core

This is an out-of-core refactor of the original [thebe](https://github.com/executablebooks/thebe) code, with no direct dependency on jQuery, minimal UI concerns and is suitable for use in a wider range of web applications than the original.

## Status

Refactoring work is still ongoing with changes and discussion being tracked [in this issue](https://github.com/executablebooks/thebe-core/issues/1)

Once we're happy with the baseline refactor, the plan is to integrate these changes back into `thebe` improving the maintainability of thst library and opening up oportunities to extend it further. Discussion and requriements for that integation are being tracked [in this issue](https://github.com/executablebooks/thebe/issues/536)

## Development

Note: Currently only a development build is available

Local setup:

```
  git clone git@github.com:executablebooks/thebe-core.git
  cd thebe-core
  yarn install
```

For local development, start a webpack devserver by:

```
  yarn start
```

This will serve example pages from `/demo` containing minimal working examples on [http://localhost:3003](http://localhost:3003), the examples
`ipywidgets.html` and `local.html` can be reached by appending to the base url.

The `local.html` example requires a local kernel, start jupyter with the following command to start a server that the demo can connect to.

```
  jupyter notebook --NotebookApp.token=test-secret --NotebookApp.allow_origin="*"
```

To create a full build, with both typescript module and webpack bundle run:

```
  yarn build
```

Output will be in the `dist` folder with the js bundle in `dist/lib`.

## Usage

### Typescript

The libary can be consumed from typescript applications via yarn / npm install as with any other package.

If you are not using redux in your application simply call `setupThebeCore()` to setup the library, `thebe-core`
will create it's own store.

If your application uses redux, integrate `thebe` into you applications store by adding it' reducer and passing yoru store to the
setup function.

```
  import { setupThebeCore, thebeReducer } from "thebe-core";
  import reducer from './app/store';

  const store = createStore(combineReducers({
      app: reducer,
      thebe: thebeReducer
    }));

  setupThebeCore(store)
```

### Javascript

For use in place javascript load `dist/lib/index.js` onto you page, in this scenario `setupThebeCore()` is called automatically
and `thebe-core` will be available on `window.thebeCore`. That object contains a ThebeContext and an JsApi with functions intended
to be used from browser based scripts.

```
  window.thebeCore = {
    ctx: ThebeContext,
    api: JsApi
  }

  interface ThebeContext {
    store: EnhancedStore<State>; // redux store
    kernels: Record<string, ThebeKernel>; // runtime objects containing kenrel connections
    notebooks: Record<string, Notebook>;  // runtime objects containing notebooks and cell renderers
  }

  interface JsApi {
    configure: (options: Partial<Options>) => void;
    connect: (options: Partial<Options>) => Promise<ThebeKernel>;
    binder: (options: Partial<Options>) => Promise<ThebeKernel>;
    jupyter: (options: Partial<Options>) => Promise<ThebeKernel>;
    setupNotebook: (blocks: CodeBlock[]) => Notebook;
    restartKernel: (kernelId: string) => void;
    clear: () => void;
  }
```

For more information on how to invoke thebe and connect to a kernel see [demo/index.html](./demo/index.html) and [demo/demo.js](./demo/demo.js).
