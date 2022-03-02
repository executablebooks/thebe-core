function bootstrap(scope, options, blocks) {
  const opts = thebeCore.api.configure(options);
  scope.notebook = thebeCore.api.setupNotebook(blocks);
  thebeCore.api.connect(opts).then((kernel) => {
    const last = scope.notebook.lastCell();
    last.attach(document.querySelector("[data-output]"));
    // TODO maybe request a named kernel here?
    scope.notebook.hookup(kernel);
    scope.kernelId = kernel.id;
  });
}
