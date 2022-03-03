function bootstrap(scope, options, blocks) {
  const opts = thebeCore.api.configure(options);
  scope.notebook = thebeCore.api.setupNotebook(blocks);
  const last = scope.notebook.lastCell();
  last.attachToDOM(document.querySelector("[data-output]"));
  thebeCore.api.connect(opts).then((kernel) => {
    scope.notebook.attachKernel(kernel);
    scope.kernelId = kernel.id;
  });
}
