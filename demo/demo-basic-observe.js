function bootstrap(scope, options, blocks) {
  const opts = thebeCore.api.configure(options);
  scope.notebook = thebeCore.api.setupNotebook(blocks);
  const last = scope.notebook.lastCell();
  last.attachToDOM(document.querySelector('[data-output]'));
  return thebeCore.api.connect(opts).then((kernel) => {
    console.log('got kernel', kernel);
    scope.notebook.attachKernel(kernel);
    scope.kernel = kernel;
    return kernel;
  });
}

async function registerServiceWorker(scriptUrl) {
  if ('serviceWorker' in navigator) {
    const register = await navigator.serviceWorker.register(scriptUrl);
    console.log('Registered service worker with scope:', register.scope);
  } else {
    console.error('Could not register service worker with script:', scriptUrl);
  }
}
