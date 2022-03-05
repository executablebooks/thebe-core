import { selectors as serversSelectors } from "./servers";
import { selectors as notebooksSelectors } from "./notebooks";
import { selectors as cellSelectors } from "./cells";
import { selectors as configSelectors } from "./config";

const selectors = {
  servers: serversSelectors,
  notebooks: notebooksSelectors,
  cells: cellSelectors,
  config: configSelectors,
};

export default selectors;
