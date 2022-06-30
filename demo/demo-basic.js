function randomId() {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return 'id-' + uint32.toString(16);
}

const code = [
  `
%matplotlib inline
import numpy as np
import matplotlib.pyplot as plt
      `,
  `
# oxa:fs
fs = 1
# oxa:phi
phi = np.pi/5
        `,
  `
plt.ion()
fig, ax = plt.subplots()
x = np.arange(-np.pi/2,np.pi/2,0.01)
y = np.cos(2*np.pi*fs*x+phi)
yy = np.sin(2*np.pi*fs*x+phi)
ax.plot(x,y);
ax.plot(x,yy);
plt.grid(True)
        `,
];

const statusCallback = ({ id, subject, status, message }) => {
  if (subject === 'server') {
    const serverStatus = document.getElementById('server-status');
    serverStatus.innerText = status;
  } else if (subject === 'session') {
    const sessionStatus = document.getElementById('session-status');
    sessionStatus.innerText = status;
  }
  console.log(`[${subject}][${status}][${id}]: ${message}`);
};

async function demoBasic(code, options) {
  const codeWithIds = code.map((c) => ({
    id: randomId(),
    source: c,
  }));
  statusCallback;

  const notebook = thebeCore.api.setupNotebook(codeWithIds, options);
  const last = notebook.lastCell();
  last.attachToDOM(document.querySelector('[data-output]'));

  const loggingCallback = ({ id, subject, status, message }) => {
    console.log(`[${subject}][${status}][${id}]: ${message}`);
  };

  const { server, session } = await thebeCore.api.connect(
    options,
    statusCallback ?? loggingCallback
  );

  await server.ready;
  await session.kernel.ready;

  notebook.attachSession(session);

  const runAllButton = document.getElementById('run-all');
  runAllButton.onclick = (ev) => {
    notebook.executeAll();
  };
  runAllButton.disabled = false;

  const runLastButton = document.getElementById('run-last');
  runLastButton.onclick = (ev) => {
    notebook.executeOnly(notebook.lastCell().id);
  };
  runLastButton.disabled = false;

  const restartButton = document.getElementById('restart');
  restartButton.onclick = (ev) => {
    session.restart();
  };
  restartButton.disabled = false;

  // const future = session.kernel.requestExecute({ code: 'print("Hello World!")' });

  // await future.done;
}
