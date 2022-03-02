import { selectors as serversSelectors } from "./servers";
import { selectors as notebooksSelectors } from "./notebooks";

const selectors = {
  servers: serversSelectors,
  notebooks: notebooksSelectors,
};

export default selectors;
