const appStartTime = Date.now();
let lastEventTime = 0;

////////////////////////////////////////////////////////////////////////////////
// Set Up Environment Variables
////////////////////////////////////////////////////////////////////////////////
const pjson = require('./package.json');
if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
} else {
  require('dotenv').config();
}

if (pjson.name === 'buffed-client-preview') {
  process.env.SLOBS_PREVIEW = true;
}
if (pjson.name === 'buffed-client-ipc') {
  process.env.SLOBS_IPC = true;
}
process.env.SLOBS_VERSION = pjson.version;

const { Updater } = require('./updater/mac/Updater.js');

////////////////////////////////////////////////////////////////////////////////
// Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  crashReporter,
  dialog,
  webContents,
  desktopCapturer,
} = require('electron');
const path = require('path');
const remote = require('@electron/remote/main');
const fs = require('fs');

// Game overlay is Windows only
let overlay;

// We use a special cache directory for running tests
if (process.env.SLOBS_CACHE_DIR) {
  app.setPath('appData', process.env.SLOBS_CACHE_DIR);
}

app.setPath('userData', path.join(app.getPath('appData'), 'buffed-client')); // TODO:

if (process.argv.includes('--clearCacheDir')) {
  try {
    // This could block for a while, but should ensure that the crash handler
    // is no longer able to interfere with cache removal.
    fs.rmSync(app.getPath('userData'), {
      force: true,
      recursive: true,
      maxRetries: 5,
      retryDelay: 500,
    });
  } catch (e) {}
}

// This ensures that only one copy of our app can run at once.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

const bootstrap = require('./updater/build/bootstrap.js');
const bundleUpdater = require('./updater/build/bundle-updater.js');
const uuid = require('uuid/v4');
const semver = require('semver');
const windowStateKeeper = require('electron-window-state');
const pid = require('process').pid;

app.commandLine.appendSwitch('force-ui-direction', 'ltr');
app.commandLine.appendSwitch(
  'ignore-connections-limit',
  'streamlabs.com,youtube.com,twitch.tv,facebook.com,mixer.com',
);

process.env.IPC_UUID = `slobs-${uuid()}`;

/* Determine the current release channel we're
 * on based on name. The channel will always be
 * the premajor identifier, if it exists.
 * Otherwise, default to latest. */
const releaseChannel = (() => {
  const components = semver.prerelease(pjson.version);

  if (components) return components[0];
  return 'latest';
})();

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

// Windows
let workerWindow;
let mainWindow;
let childWindow;
let monitorProcess;

const util = require('util');
const logFile = path.join(app.getPath('userData'), 'app.log');
const maxLogBytes = 131072;

// Truncate the log file if it is too long
if (fs.existsSync(logFile) && fs.statSync(logFile).size > maxLogBytes) {
  const content = fs.readFileSync(logFile);
  fs.writeFileSync(logFile, '[LOG TRUNCATED]\n');
  fs.writeFileSync(logFile, content.slice(content.length - maxLogBytes), { flag: 'a' });
}

ipcMain.on('logmsg', (e, msg) => {
  if (msg.level === 'error' && mainWindow && process.env.NODE_ENV !== 'production') {
    mainWindow.send('unhandledErrorState');
  }

  logFromRemote(msg.level, msg.sender, msg.message);
});

function logFromRemote(level, sender, msg) {
  msg.split('\n').forEach(line => {
    writeLogLine(`[${new Date().toISOString()}] [${level}] [${sender}] - ${line}`);
  });
}

const consoleLog = console.log;
console.log = (...args) => {
  if (!process.env.SLOBS_DISABLE_MAIN_LOGGING) {
    const serialized = args
      .map(arg => {
        if (typeof arg === 'string') return arg;

        return util.inspect(arg);
      })
      .join(' ');

    logFromRemote('info', 'electron-main', serialized);
  }
};

const lineBuffer = [];

function writeLogLine(line) {
  // Also print to stdout
  consoleLog(line);

  lineBuffer.push(`${line}\n`);
  flushNextLine();
}

let writeInProgress = false;

function flushNextLine() {
  if (lineBuffer.length === 0) return;
  if (writeInProgress) return;

  const nextLine = lineBuffer.shift();

  writeInProgress = true;

  fs.writeFile(logFile, nextLine, { flag: 'a' }, e => {
    writeInProgress = false;

    if (e) {
      consoleLog('Error writing to log file', e);
      return;
    }

    flushNextLine();
  });
}

const os = require('os');
const cpus = os.cpus();

// Source: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
function humanFileSize(bytes, si) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

console.log('=================================');
console.log('Buffed Desktop');
console.log(`Version: ${process.env.SLOBS_VERSION}`);
console.log(`OS: ${os.platform()} ${os.release()}`);
console.log(`Arch: ${process.arch}`);
console.log(`CPU: ${cpus[0].model}`);
console.log(`Cores: ${cpus.length}`);
console.log(`Memory: ${humanFileSize(os.totalmem(), false)}`);
console.log(`Free: ${humanFileSize(os.freemem(), false)}`);
console.log('=================================');

app.on('activate', () => {
  console.log(`APP ACTIVATED`);
  mainWindow?.show();
})

app.on('ready', () => {
  // Detect when running from an unwritable location like a DMG image (will break updater)
  if (process.platform === 'darwin') {
    try {
      fs.accessSync(app.getPath('exe'), fs.constants.W_OK);
    } catch (e) {
      // This error code indicates a read only file system
      if (e.code === 'EROFS') {
        dialog.showErrorBox(
          'Buffed Desktop',
          'Please run Buffed Desktop from your Applications folder. Buffed Desktop cannot run directly from this disk image.',
        );

        console.log(`App exit 1.`);
        app.exit();
      }
    }
  }

  // network logging is disabled by default
  if (!process.argv.includes('--network-logging')) return;

  // ignore fs requests
  const filter = { urls: ['https://*', 'http://*'] };

  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    console.log('HTTP REQUEST', details.method, details.url);
    callback(details);
  });

  session.defaultSession.webRequest.onErrorOccurred(filter, details => {
    console.log('HTTP REQUEST FAILED', details.method, details.url);
  });

  session.defaultSession.webRequest.onCompleted(filter, details => {
    console.log('HTTP REQUEST COMPLETED', details.method, details.url, details.statusCode);
  });
});

// Somewhat annoyingly, this is needed so that the main window
// can differentiate between a user closing it vs the app
// closing the windows before exit.
let allowMainWindowClose = false;
let shutdownStarted = false;
let appShutdownTimeout;

console.log(`Main: indexurl will set to: file://${__dirname}/index.html`);
global.indexUrl = `file://${__dirname}/index.html`;

function openDevTools() {
  console.log(`Main: openDevTools`);
  childWindow.webContents.openDevTools({ mode: 'undocked' });
  mainWindow.webContents.openDevTools({ mode: 'undocked' });
  workerWindow.webContents.openDevTools({ mode: 'undocked' });
  monitorProcess?.webContents.openDevTools({ mode: 'undocked' }); // TODO: make sure monitorProcess exists by the time it's called
}

// TODO: Clean this up
// These windows are waiting for services to be ready
const waitingVuexStores = [];
let workerInitFinished = false;

async function startApp() {
  console.log(`Main: startApp inside func.`);

  const crashHandler = require('crash-handler');
  const isDevMode = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  const crashHandlerLogPath = app.getPath('userData');

  if (process.platform === 'win32') {
    overlay = require('game_overlay');
  }

  console.log(`Main: Start bundle updater`);
  await bundleUpdater(__dirname);

  console.log(`Main: Start crash handler`);
  // crashHandler.startCrashHandler(
  //   app.getAppPath(),
  //   process.env.SLOBS_VERSION,
  //   isDevMode.toString(),
  //   crashHandlerLogPath,
  //   process.env.IPC_UUID,
  // );
  // crashHandler.registerProcess(pid, false);

  ipcMain.on('register-in-crash-handler', (event, arg) => {
    crashHandler.registerProcess(arg.pid, arg.critical);
  });

  ipcMain.on('unregister-in-crash-handler', (event, arg) => {
    crashHandler.unregisterProcess(arg.pid);
  });

  console.log(`Main: Start remote`);
  remote.initialize();

  const Raven = require('raven');

  function handleFinishedReport() {
    dialog.showErrorBox(
      'Something Went Wrong',
      'An unexpected error occured and Buffed Desktop must be shut down.\n' +
        'Please restart the application.',
    );

    console.log(`App exit 2.`);
    app.exit();
  }

  if (pjson.env === 'production') {
    console.log(`Main: Start sentry`);
    // Raven.config(pjson.sentryFrontendDSN, {
    //   release: process.env.SLOBS_VERSION,
    // }).install((err, initialErr, eventId) => {
    //   handleFinishedReport();
    // });

    // const submitURL = process.env.SLOBS_PREVIEW
    //   ? pjson.sentryBackendClientPreviewURL
    //   : pjson.sentryBackendClientURL;

    // if (submitURL) {
    //   crashReporter.start({
    //     productName: 'streamlabs-obs',
    //     companyName: 'streamlabs',
    //     ignoreSystemCrashHandler: true,
    //     submitURL,
    //     extra: {
    //       processType: 'main',
    //     },
    //     globalExtra: {
    //       'sentry[release]': pjson.version,
    //       'sentry[user][ip]': '{{auto}}',
    //     },
    //   });
    // }
  }

  console.log(`Main: Start worker window`);

  // All renderers should use ipcRenderer.sendTo to send to communicate with
  // the worker.  This still gets proxied via the main process, but eventually
  // we will refactor this to not use electron IPC, which will make it much
  // more efficient.
  ipcMain.on('getWorkerWindowId', event => {
    event.returnValue = workerWindow.webContents.id;
  });

  const isLaunchedAutoAtLogin = process.argv.includes('--was-launched-at-login');
  if (!isLaunchedAutoAtLogin) {
    recreateAndShowMainWindow();  
  }
  
  // This needs to be explicitly handled on Mac
  app.on('before-quit', e => {
    console.log(`Main: app.on('before-quit')`);

    if (!shutdownStarted) {
      beginShutdown()
      e.preventDefault();
      // if (mainWindow) {
      //   console.log(`Call close on main window.`)
      //   e.preventDefault();
      //   mainWindow.close();
      // }
    }
  });

  ipcMain.on('acknowledgeShutdown', () => {
    console.log(`Main: acknowledgeShutdown`);
    if (appShutdownTimeout) clearTimeout(appShutdownTimeout);
  });

  ipcMain.on('shutdownComplete', () => {
    console.log(`Main: shutdownComplete`);
    allowMainWindowClose = true;
    mainWindow.close();
    workerWindow.close();
    monitorProcess.close();
  });

  console.log(`Main: Show dev tools: ${process.env.SLOBS_PRODUCTION_DEBUG}`);
  //if (process.env.SLOBS_PRODUCTION_DEBUG) openDevTools();
  // openDevTools();

  // simple messaging system for services between windows
  // WARNING! renderer windows use synchronous requests and will be frozen
  // until the worker window's asynchronous response
  const requests = {};

  function sendRequest(request, event = null, async = false) {
    console.log(`Main: sendRequest ${JSON.stringify(request)}`);
    if (workerWindow.isDestroyed()) {
      console.log('Tried to send request but worker window was missing...');
      return;
    }
    workerWindow.webContents.send('services-request', request);
    if (!event) return;
    requests[request.id] = Object.assign({}, request, { event, async });
  }

  // use this function to call some service method from the main process
  function callService(resource, method, ...args) {
    sendRequest({
      jsonrpc: '2.0',
      method,
      params: {
        resource,
        args,
      },
    });
  }

  ipcMain.on('AppInitFinished', () => {
    console.log(`Main: AppInitFinished`);
    workerInitFinished = true;

    waitingVuexStores.forEach(winId => {
      BrowserWindow.fromId(winId).send('initFinished');
    });

    waitingVuexStores.forEach(windowId => {
      workerWindow.webContents.send('vuex-sendState', windowId);
    });

    monitorProcess.webContents.send('AppInitFinished')
  });

  ipcMain.on('services-request', (event, payload) => {
    console.log(`Main: services-request`);
    sendRequest(payload, event);
  });

  ipcMain.on('services-request-async', (event, payload) => {
    console.log(`Main: services-request-async`);
    sendRequest(payload, event, true);
  });

  ipcMain.on('services-response', (event, response) => {
    console.log(`Main: services-response`);
    if (!requests[response.id]) return;

    if (requests[response.id].async) {
      requests[response.id].event.reply('services-response-async', response);
    } else {
      requests[response.id].event.returnValue = response;
    }
    delete requests[response.id];
  });

  ipcMain.on('services-message', (event, payload) => {
    console.log(`Main: services-message`);
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (window.id === workerWindow.id || window.isDestroyed()) return;
      window.webContents.send('services-message', payload);
    });
  });

  if (isDevMode) {
    // Vue dev tools appears to cause strange non-deterministic
    // interference with certain NodeJS APIs, expecially asynchronous
    // IO from the renderer process.  Enable at your own risk.
    // const devtoolsInstaller = require('electron-devtools-installer');
    // devtoolsInstaller.default(devtoolsInstaller.VUEJS_DEVTOOLS);
    // setTimeout(() => {
    //   openDevTools();
    // }, 10 * 1000);
  }

  //////////////////////////////////////////////////
  // Games Monitor Setup
  //////////////////////////////////////////////////
  console.log('Setup Games Monitor')
  monitorProcess = new BrowserWindow({
    title: 'Games Monitor',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });
  remote.enable(monitorProcess.webContents);
  let ghtml = `file://${__dirname}/monitor-helper/index.html`
  monitorProcess.loadURL(ghtml);
  
  monitorProcess?.webContents.openDevTools({ mode: 'undocked' });

  console.log(`Main: End startApp`);
}

function beginShutdown() {
  if (!shutdownStarted) {
    console.log('Begin shutdown.')
    shutdownStarted = true;
    workerWindow.send('shutdown');

    // We give the worker window 10 seconds to acknowledge a request
    // to shut down.  Otherwise, we just close it.
    appShutdownTimeout = setTimeout(() => {
      console.log('Timeout out. Forcing.')
      allowMainWindowClose = true;
      if (!mainWindow.isDestroyed()) mainWindow.close();
      if (!workerWindow.isDestroyed()) workerWindow.close();
      if (!monitorProcess.isDestroyed()) monitorProcess.close();
      if (!childWindow.isDestroyed()) childWindow.close();

      setTimeout(() => {
      console.log('Windows:')
      console.log(`Main: ${mainWindow.isDestroyed()}`)
      console.log(`Worker: ${workerWindow.isDestroyed()}`)
      console.log(`Monitor: ${monitorProcess.isDestroyed()}`)
      console.log(`Child: ${childWindow.isDestroyed()}`)
      }, 1 * 1000);

      
    }, 10 * 1000);
  } else {
    console.log('Shutdown already started. Ignore.')
  }
}

function recreateAndShowMainWindow() {

  console.log(`Recreating. Child window destroyed?: ${childWindow?.isDestroyed()}`)
  ///////////////////////////////////////
  // Worker Window
  ///////////////////////////////////////
  workerWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  remote.enable(workerWindow.webContents);
  // setTimeout(() => {
  workerWindow.loadURL(`${global.indexUrl}?windowId=worker`);
  // }, 10 * 1000);


  ///////////////////////////////////////
  // Main Window
  ///////////////////////////////////////
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1600,
    defaultHeight: 1000,
  });
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.isMaximized ? mainWindowState.displayBounds.x : mainWindowState.x,
    y: mainWindowState.isMaximized ? mainWindowState.displayBounds.y : mainWindowState.y,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'Buffed Desktop',
    backgroundColor: '#17242D',
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false,
    },
  });
  remote.enable(mainWindow.webContents);
  // setTimeout(() => {
  mainWindow.loadURL(`${global.indexUrl}?windowId=main`);
  // }, 5 * 1000)
  mainWindowState.manage(mainWindow);
  mainWindow.removeMenu();
  
  ///////////////////////////////////////
  // Child Window
  ///////////////////////////////////////  
  childWindow = new BrowserWindow({
    show: false,
    frame: false,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#17242D',
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: false,
    },
  });
  remote.enable(childWindow.webContents);
  childWindow.removeMenu();
  childWindow.loadURL(`${global.indexUrl}?windowId=child`);
  
  ///////////////////////////////////////
  // Event Handlers
  ///////////////////////////////////////

  // The child window is never closed, it just hides in the
  // background until it is needed.
  childWindow.on('close', e => {
    console.log(`On child window close.`)

    if (!shutdownStarted) {
      childWindow.send('closeWindow');
      // Prevent the window from actually closing
      e.preventDefault();
    }
  });

  mainWindow.on('show', e => {
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  mainWindow.on('close', e => {
    console.log(`Main: mainWindow.on('close')`);
    mainWindow.hide();
    
    // Hide the app icon from the Dock
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    if (!allowMainWindowClose) {
      console.log('Closing main window prevented.')
      e.preventDefault();
    }
  });

  // prevent worker window to be closed before other windows
  // we need it to properly handle App.stop() in tests
  // since it tries to close all windows
  workerWindow.on('close', e => {
    console.log(`Main: workerWindow.on('close')`);
    if (!shutdownStarted) {
      console.log(`Main: workerWindow.on('close') - !shutdownStarted`);
      e.preventDefault();
      mainWindow.close();
    }
  });

  workerWindow.on('closed', () => {
    console.log(`Main: workerWindow.on('closed')`);
    session.defaultSession.flushStorageData();
    // session.defaultSession.cookies.flushStore().then(() => app.quit());
    session.defaultSession.cookies.flushStore().then(() => {
        // ...
    });
  });

  //if (process.env.SLOBS_PRODUCTION_DEBUG) openDevTools();
  //openDevTools();
}

const haDisableFile = path.join(app.getPath('userData'), 'HADisable');
if (fs.existsSync(haDisableFile)) app.disableHardwareAcceleration();

//app.setAsDefaultProtocolClient('buffed');
app.setAsDefaultProtocolClient('me.buffed.app.desktop');

app.on('second-instance', (event, argv, cwd) => {
  // Check for protocol links in the argv of the other process
  argv.forEach(arg => {

    console.log(`Args: ${arg}`)

    if (arg.match(/^me\.buffed\.app\.desktop:\/\//)) {
      workerWindow.send('protocolLink', arg);
    }
  });

  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  } else if (!shutdownStarted) {
    // This instance is a zombie and we should shut down.

    console.log(`App exit 3.`);
    app.exit();
  }
});

let protocolLinkReady = false;
let pendingLink;

// For mac os, this event will fire when a protocol link is triggered
app.on('open-url', (e, url) => {
  console.log(`open-url: ${url}`)

  if (protocolLinkReady) {
    workerWindow.send('protocolLink', url);
  } else {
    pendingLink = url;
  }
  
  showApp();
});

ipcMain.on('protocolLinkReady', () => {
  protocolLinkReady = true;
  console.log(`Pendinglink: ${pendingLink}`)
  if (pendingLink) workerWindow.send('protocolLink', pendingLink);
});

console.log(`Main: app.on('ready')`);

app.on('ready', () => {

  console.log(`On app ready`)

  if (
    !process.argv.includes('--skip-update') &&
    (process.env.NODE_ENV === 'production' || process.env.SLOBS_FORCE_AUTO_UPDATE)
  ) {
    console.log(`Main: updater`);
    new Updater(startApp, releaseChannel).run();
  } else {
    console.log(`Main: startApp`);
    startApp();
  }
  // if (
  //   !process.argv.includes('--skip-update') &&
  //   (process.env.NODE_ENV === 'production' || process.env.SLOBS_FORCE_AUTO_UPDATE)
  // ) {
  //   // Windows uses our custom update, Mac uses electron-updater
  //   if (process.platform === 'win32') {
  //     const updateInfo = {
  //       baseUrl: 'https://buffed-cdn.buffed.me',
  //       version: pjson.version,
  //       exec: process.argv,
  //       cwd: process.cwd(),
  //       waitPids: [process.pid],
  //       appDir: path.dirname(app.getPath('exe')),
  //       tempDir: path.join(app.getPath('temp'), 'slobs-updater'),
  //       cacheDir: app.getPath('userData'),
  //       versionFileName: `${releaseChannel}.json`,
  //     };

  //     console.log(`Main: bootstrap`);
  //     bootstrap(updateInfo, startApp, app.exit);
  //   } else {
      // console.log(`Main: updater`);
      // new Updater(startApp, releaseChannel).run();
  //   }
  // } else {
  //   console.log(`Main: startApp`);
  //   startApp();
  // }
});

ipcMain.on('openDevTools', () => {
  openDevTools();
});

ipcMain.on('window-closeChildWindow', event => {
  // never close the child window, hide it instead
  if (!childWindow.isDestroyed()) childWindow.hide();
});

ipcMain.on('window-focusMain', () => {
  if (!mainWindow.isDestroyed()) mainWindow.focus();
});

// The main process acts as a hub for various windows
// syncing their vuex stores.
const registeredStores = {};

ipcMain.on('vuex-register', event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const windowId = win.id;

  // Register can be received multiple times if the window is
  // refreshed.  We only want to register it once.
  if (!registeredStores[windowId]) {
    registeredStores[windowId] = win;
    console.log('Registered vuex stores: ', Object.keys(registeredStores));

    // Make sure we unregister is when it is closed
    win.on('closed', () => {
      delete registeredStores[windowId];
      console.log('Registered vuex stores: ', Object.keys(registeredStores));
    });
  }

  if (windowId !== workerWindow.id) {
    // Tell the worker window to send its current store state
    // to the newly registered window

    if (workerInitFinished) {
      win.send('initFinished');
      workerWindow.webContents.send('vuex-sendState', windowId);
    } else {
      waitingVuexStores.push(windowId);
    }
  }
});

// Proxy vuex-mutation events to all other subscribed windows
ipcMain.on('vuex-mutation', (event, mutation) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  if (senderWindow && !senderWindow.isDestroyed()) {
    const windowId = senderWindow.id;

    Object.keys(registeredStores)
      .filter(id => id !== windowId.toString())
      .forEach(id => {
        const win = registeredStores[id];
        if (!win.isDestroyed()) win.webContents.send('vuex-mutation', mutation);
      });
  }
});

ipcMain.on('restartApp', () => {
  app.relaunch();
  // Closing the main window starts the shut down sequence
  mainWindow.close();
});

ipcMain.on('streamlabels-writeFile', (e, info) => {
  fs.writeFile(info.path, info.data, err => {
    if (err) {
      console.log('Streamlabels: Error writing file', err);
    }
  });
});

const guestApiInfo = {};

ipcMain.on('guestApi-setInfo', (e, info) => {
  guestApiInfo[info.webContentsId] = {
    schema: info.schema,
    hostWebContentsId: info.hostWebContentsId,
    ipcChannel: info.ipcChannel,
  };
});

ipcMain.on('guestApi-getInfo', e => {
  e.returnValue = guestApiInfo[e.sender.id];
});

/* The following 3 methods need to live in the main process
    because events bound using the remote module are not
    executed synchronously and therefore default actions
    cannot be prevented. */
ipcMain.on('webContents-preventNavigation', (e, id) => {
  const contents = webContents.fromId(id);

  if (contents.isDestroyed()) return;

  contents.on('will-navigate', e => {
    e.preventDefault();
  });
});

ipcMain.on('webContents-bindYTChat', (e, id) => {
  const contents = webContents.fromId(id);

  if (contents.isDestroyed()) return;

  contents.on('will-navigate', (e, targetUrl) => {
    const url = require('url');
    const parsed = url.parse(targetUrl);

    if (parsed.hostname === 'accounts.google.com') {
      e.preventDefault();
    }
  });
});

ipcMain.on('webContents-enableRemote', (e, id) => {
  const contents = webContents.fromId(id);

  if (contents.isDestroyed()) return;

  remote.enable(contents);

  // Needed otherwise the renderer will lock up
  e.returnValue = null;
});

ipcMain.on('getMainWindowWebContentsId', e => {
  e.returnValue = mainWindow.webContents.id;
});

ipcMain.on('requestPerformanceStats', e => {
  const stats = app.getAppMetrics();
  e.sender.send('performanceStatsResponse', stats);
});

ipcMain.on('showErrorAlert', () => {
  if (!mainWindow.isDestroyed()) {
    // main window may be destroyed on shutdown
    mainWindow.send('showErrorAlert');
  }
});

ipcMain.on('gameOverlayPaintCallback', (e, { contentsId, overlayId }) => {
  const contents = webContents.fromId(contentsId);

  if (contents.isDestroyed()) return;

  contents.on('paint', (event, dirty, image) => {
    if (
      overlay.paintOverlay(
        overlayId,
        image.getSize().width,
        image.getSize().height,
        image.getBitmap(),
      ) === 0
    ) {
      contents.invalidate();
    }
  });
});

ipcMain.on('getWindowIds', e => {
  e.returnValue = {
    worker: workerWindow.id,
    main: mainWindow.id,
    child: childWindow.id,
  };
});

ipcMain.on('getAppStartTime', e => {
  e.returnValue = appStartTime;
});

ipcMain.on('measure-time', (e, msg, time) => {
  measure(msg, time);
});

// Measure time between events
function measure(msg, time) {
  if (!time) time = Date.now();
  const delta = lastEventTime ? time - lastEventTime : 0;
  lastEventTime = time;
  if (delta > 2000) console.log('------------------');
  console.log(msg, delta + 'ms');
}

ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', (event, opts) => desktopCapturer.getSources(opts));

ipcMain.handle('SHOW_APP', (event, opts) => {
  showApp();
});

ipcMain.on('STREAMING_STATE_CHANGED', (event, streamingState) => {
 monitorProcess?.webContents.send('STREAMING_STATE_CHANGED', streamingState);
})

function showApp() {
  if (!mainWindow) {
    recreateAndShowMainWindow();
  } else {
    mainWindow.show();
  }
}

console.log(`REGISTER for BEGIN SHUTDOWN`)
ipcMain.handle('BEGIN_SHUTDOWN', (event, opts) => {
  console.log('Received shutdown.')
  beginShutdown();
});


console.log(`Main: End file`);