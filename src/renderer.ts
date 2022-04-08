import { ThebeContext } from "./types";
import { OutputArea, OutputAreaModel } from "@jupyterlab/outputarea";
import { ThebeManager, WIDGET_MIMETYPE } from "./manager";
import ThebeKernel from "./kernel";
import { actions, selectors } from "./store";
import PassiveCellRenderer from "./passive";

class CellRenderer extends PassiveCellRenderer {
  ctx: ThebeContext;
  notebook: string;

  constructor(ctx: ThebeContext, id: string, notebook: string) {
    const mathjax = selectors.config.selectMathjaxConfig(ctx.store.getState());

    super(id, mathjax);

    this.ctx = ctx;
    this.id = id;
    this.notebook = notebook;
  }

  get isBusy() {
    return (
      this.area.node.parentElement?.querySelector(
        `[data-thebe-busy=c-${this.id}]`
      ) != null
    );
  }

  get isAttachedToKernel() {
    return (
      this.ctx.store.getState().thebe.cells[this.id].attachedKernelId != null
    );
  }

  /**
   * Wait for a kernel to be available and attach it to the cell
   *
   * NOTE: this function is intentended to be used when rendering a single cell only
   * If you are using mulitple cells via Notebook, you should use Notebook.waitForKernel instead
   *
   * @param kernel - ThebeKernel
   * @returns
   */
  async waitForKernel(kernel: Promise<ThebeKernel>) {
    return kernel.then((k) => {
      if (!k.connection) throw Error("kernel returned with no connection");
      const cdnOnly = true;
      const manager = new ThebeManager(k.connection, cdnOnly);
      this.attachKernel(k.id, manager);
      return k;
    });
  }

  attachKernel(kernelId: string, manager: ThebeManager) {
    this.rendermime.removeMimeType(WIDGET_MIMETYPE);
    if (this.rendermime) manager.addWidgetFactories(this.rendermime);
    this.ctx.store.dispatch(
      actions.cells.attachKernel({ id: this.id, kernelId })
    );
  }

  detachKernel() {
    this.rendermime.removeMimeType(WIDGET_MIMETYPE);
    this.ctx.store.dispatch(actions.cells.detachKernel({ id: this.id }));
  }

  renderBusy(show: boolean) {
    if (!this.isAttachedToDOM) return;
    console.debug(`thebe:renderer:busy ${show} ${this.id}`);
    if (show) {
      const busy = document.createElement("div");
      busy.className = "thebe-busy";
      busy.style.position = "absolute";
      busy.style.top = "0px";
      busy.style.left = "0px";
      busy.style.backgroundColor = "white";
      busy.style.opacity = "0.5";
      busy.style.height = "100%";
      busy.style.width = "100%";
      busy.style.zIndex = "100";
      busy.setAttribute("data-thebe-busy", `c-${this.id}`);

      const spinner = document.createElement("div");
      spinner.className = "thebe-core-busy-spinner";
      busy.append(spinner);

      this.area.node.parentElement?.append(busy);
    } else {
      const busy = this.area.node.parentElement?.querySelector(".thebe-busy");
      busy?.parentElement?.removeChild(busy);
    }
  }

  /**
   * TODO
   *  - pass execute_count or timestamp or something back to redux on success/failure?
   *
   * @param source
   * @returns
   */
  async execute(
    source: string
  ): Promise<{ height: number; width: number } | null> {
    const kernelId = selectors.cells.selectAttachedKernelId(
      this.ctx.store.getState(),
      this.id
    );
    if (!this.isAttachedToKernel || !kernelId) {
      console.warn(
        "Attempting to execute on a cell without an attached kernel"
      );
      return null;
    }
    const kernel: ThebeKernel = this.ctx.kernels[kernelId!]; // TODO kernel exists/alive check?
    if (!kernel || !kernel.connection)
      throw Error(`thebe:renderer:execute No connection info for ${kernelId}`);

    try {
      console.debug(`thebe:renderer:execute ${this.id}`);
      if (!this.isBusy) this.renderBusy(true);

      const useShadow = true;
      if (useShadow) {
        // Use a shadow output area for the execute request
        const model = new OutputAreaModel({ trusted: true });
        console.log(`thebe:renderer:execute:rendermine`, this.rendermime);
        const area = new OutputArea({
          model,
          rendermime: this.rendermime!,
        });

        area.future = kernel.connection.requestExecute({ code: source });
        await area.future.done;

        // trigger an update via the model associated with the OutputArea
        // that is attached to the DOM
        this.model.fromJSON(model.toJSON());
      } else {
        this.area.future = kernel.connection.requestExecute({
          code: source,
        });
        await this.area.future.done;
      }

      this.renderBusy(false);
      return {
        height: this.area.node.offsetHeight,
        width: this.area.node.offsetWidth,
      };
    } catch (err: any) {
      console.error("thebe:renderer:execute Error:", err);
      this.ctx.store.dispatch(
        actions.errors.cell({ id: this.id, message: err.message })
      );
      this.clearOnError(err);
      this.renderBusy(false);
      return null;
    }
  }
}

export default CellRenderer;
