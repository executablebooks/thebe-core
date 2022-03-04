import { selectors as serversSelectors } from "./servers";
import { selectors as notebooksSelectors } from "./notebooks";
import { selectors as configSelectors } from "./config";

const selectors = {
  servers: serversSelectors,
  notebooks: notebooksSelectors,
  config: configSelectors,
};

export default selectors;
