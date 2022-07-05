const NodeEnvironment = require('jest-environment-node').default;
import { JupyterServer } from '@jupyterlab/testutils';

class CustomEnvironment extends NodeEnvironment {
  server?: any;
  url?: string;

  constructor(config: any, context: any) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    this.server = new JupyterServer();
    try {
      this.url = await this.server.start();
      console.log('Started Jupyter Server', this.url);
    } catch (err: any) {
      console.log('Server start failed', err.message);
    }
  }

  async teardown() {
    if (this.server) this.server.shutdown();
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
