import { getRenderMimeRegistry } from "./rendermime";
import { MathjaxOptions, ThebeContext } from "./types";
import { OutputArea, OutputAreaModel } from "@jupyterlab/outputarea";
import { Widget } from "@lumino/widgets";
import { ThebeManager, WIDGET_MIMETYPE } from "./manager";
import { RenderMimeRegistry } from "@jupyterlab/rendermime";
import { WidgetRenderer } from "@jupyter-widgets/jupyterlab-manager";
import ThebeKernel from "./kernel";
import { actions } from "./store";

class CellRenderer {
  ctx: ThebeContext;
  id: string;
  notebook: string;

  rendermime?: RenderMimeRegistry;
  model?: OutputAreaModel;
  area?: OutputArea;

  constructor(ctx: ThebeContext, id: string, notebook: string) {
    this.ctx = ctx;
    this.id = id;
    this.notebook = notebook;
  }

  get isBusy() {
    return (
      this.area?.node.parentElement?.querySelector(
        `[data-thebe-busy=c-${this.id}]`
      ) != null
    );
  }

  get isAttachedToDOM() {
    return this.area?.isAttached;
  }

  get isAttachedToKernel() {
    return (
      this.ctx.store.getState().thebe.cells[this.id].attachedKernelId != null
    );
  }

  /**
   * Initialise a cell
   *
   * Purpose of init in thebe-core is to create the output area, model and rendermimes
   * components needed to handle output of that cell based on a kernel return message
   */
  init(mathjax: MathjaxOptions) {
    // TODO can we use a single instance of the rendermime registry? in context?
    // TODO this should be in constructor
    this.rendermime = getRenderMimeRegistry(mathjax);
    this.model = new OutputAreaModel({ trusted: true });
    this.area = new OutputArea({
      model: this.model,
      rendermime: this.rendermime,
    });
  }

  attachKernel(kernelId: string, manager: ThebeManager) {
    this.rendermime?.removeMimeType(WIDGET_MIMETYPE);
    if (this.rendermime) manager.addWidgetFactories(this.rendermime);
    this.ctx.store.dispatch(
      actions.cells.attachKernel({ id: this.id, kernelId })
    );
  }

  detachKernel() {
    this.rendermime?.removeMimeType(WIDGET_MIMETYPE);
    this.ctx.store.dispatch(actions.cells.detachKernel({ id: this.id }));
  }

  attachToDOM(el: HTMLElement) {
    if (!this.area) return;
    if (this.area.isAttached) return;
    console.debug(`thebe:renderer:attach ${this.id}`);

    // if the target element has contents, preserve it but wrap it in our output area
    if (el.innerHTML) {
      this.area.model.add({
        output_type: "display_data",
        data: {
          "text/html": el.innerHTML,
        },
      });
    }
    el.textContent = "";

    const div = document.createElement("div");
    div.style.position = "relative";
    div.className = "thebe-cell-renderer";
    el.append(div);

    Widget.attach(this.area, div);
  }

  setOutputText(text: string) {
    if (!this.area) return;
    this.area.model.clear(true);
    this.area.model.add({
      output_type: "stream",
      name: "stdout",
      text,
    });
  }

  clearOnError(error: any) {
    if (!this.area) return;
    // could update redux with state here?
    this.area.model.clear();
    this.area.model.add({
      output_type: "stream",
      name: "stderr",
      text: `Failed to execute. ${error} Please refresh the page.`,
    });
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

      this.area?.node.parentElement?.append(busy);
    } else {
      const busy = this.area?.node.parentElement?.querySelector(".thebe-busy");
      busy?.parentElement?.removeChild(busy);
    }
  }

  /**
   * TODO
   *  - pass execute_count or timestamp or something back to redux on success/failure?
   *
   * @param kernelId
   * @param source
   * @returns
   */
  async execute(
    kernelId: string,
    source: string
  ): Promise<{ height: number; width: number } | null> {
    if (!this.area) return null;
    const kernel: ThebeKernel = this.ctx.kernels[kernelId]; // TODO kernel exists/alive check?
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
        this.model?.fromJSON(model.toJSON());
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
