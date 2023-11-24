import { TrayManager } from 'Tray/TrayManager';

import { RunningAppInfo, RunningAppsObserver } from './RunningAppsObserver';
import path from 'path';
import electron from 'electron';
import * as remote from '@electron/remote';
import Utils from 'services/utils';
import { OS, byOS } from 'util/operating-systems';
import { first } from 'lodash';
import { GameInfo, fetchGamesList } from './API+Games';
import { WindowInfo } from '@paymoapp/active-window';
const { app } = remote;

// Same as import { EStreamingState } from 'services/streaming';
// but I can't import it here
enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending',
  Reconnecting = 'reconnecting',
}

class GamesMonitor {
  private observer = new RunningAppsObserver();
  private currentStreamStatus: EStreamingState = EStreamingState.Offline;
  private executableNameToGameMap: { [key: string]: GameInfo } = {};
  private statusAwaitingForChange: EStreamingState | null = null;
  private didAutoStartStreaming = false;

  constructor() {
    console.log('[GamesMonitor] Creating.');

    electron.ipcRenderer.on('STREAMING_STATE_CHANGED', (event, status) => {
      console.log(`Received streaming state: ${status}`);
      this.currentStreamStatus = status;
      if (status == EStreamingState.Offline) {
        // reset
        this.didAutoStartStreaming = false;
      }
    });

    new Promise(async (resolve, reject) => {
      console.log('Download games list...');
      const gamesList = await fetchGamesList();
      console.log(`Games list downloaded. ${gamesList.length} games.`);

      gamesList.forEach(game => {
        game.executables?.forEach(executable => {
          let name = path.basename(executable.name).toLocaleLowerCase();
          const isMac = executable.os === 'darwin';
          if (isMac) {
            // Because 'app' is not actually a binary but the file in
            // Contents/MacOS which has no extension
            name = name.replace('.app', '');
          }
          this.executableNameToGameMap[name] = game;
        });
      });
      resolve(1);
    });
  }

  async startBackgroundMonitoring() {
    console.log('[GamesMonitor] Start background monitoring...');

    console.log('[GamesMonitor] Waiting 5 seconds...');

    console.log('[GamesMonitor] Start observing.');

    this.observer.onRunningAppsChanged = appsList => {
      this.handle(appsList, false, true);
    };
    this.observer.onFocusedWindowChanged = windowInfo => {
      this.handleWindow(windowInfo);
    };

    electron.ipcRenderer.on('SET_AUTO_STREAMING_STATE', async (e, state) => {
      console.log(`Received SET_AUTO_STREAMING_STATE = ${state}`);
      if (state) {
        // Wait to make sure everything else is loaded
        await Utils.sleep(5 * 1000);
        this.observer.start();
      } else {
        this.observer.stop();
      }
    });
  }

  handleWindow(window: WindowInfo) {
    const app: RunningAppInfo = {
      pid: window.pid.toString(),
      command: window.path,
      arguments: [window.path],
    };
    this.handle([app], true, false);
  }

  handle(apps: RunningAppInfo[], allowStart: boolean, allowEnd: boolean) {
    if (
      this.currentStreamStatus === EStreamingState.Starting ||
      this.currentStreamStatus === EStreamingState.Ending ||
      this.currentStreamStatus === EStreamingState.Reconnecting
    ) {
      console.log('Is in transition state. Skip.');
      return;
    }

    if (this.currentStreamStatus === EStreamingState.Live && !allowEnd) {
      return;
    }
    if (this.currentStreamStatus === EStreamingState.Offline && !allowStart) {
      return;
    }

    if (allowEnd && !this.didAutoStartStreaming) {
      // If we are allowed to end the stream, but we didn't start it, don't end it
      return;
    }

    const isMac = byOS({ [OS.Windows]: false, [OS.Mac]: true });
    const runningPaths = apps.map(app =>
      isMac ? first(app.arguments) ?? app.command : app.command,
    );

    // apps.forEach(app => {
    //   console.log(`App: ${app.command} - ${app.arguments}`);
    // });

    const runningGame = runningPaths.find(thePath => {
      const fileName = path.basename(thePath).toLocaleLowerCase();
      const matchingGame = this.executableNameToGameMap[fileName];

      if (!matchingGame) {
        return false;
      }

      const strictMatch = matchingGame.executables?.find(executable => {
        return thePath.toLowerCase().replace(/\\/g, '/').includes(executable.name.toLowerCase());
      });
      if (!strictMatch) {
        const executableNames = matchingGame.executables?.map(executable => executable.name);
        console.log(
          `Skip because no strict match. Path: ${thePath}. Game: ${JSON.stringify(
            executableNames,
          )}`,
        );
        return false;
      }

      // TODO: Skip if launcher?
      console.log(`Detected game running: ${matchingGame.name}`);
      return true;
    });

    const isAnyGameRunning = runningGame !== undefined;
    if (isAnyGameRunning) {
      console.log(`Detected game running: ${runningGame}`);
    }

    const newStatus: EStreamingState = isAnyGameRunning
      ? EStreamingState.Live
      : EStreamingState.Offline;

    console.log('Resolved status:', newStatus);

    if (this.statusAwaitingForChange !== null && this.statusAwaitingForChange !== newStatus) {
      console.log('Status changed in the meantime, reset');
      this.statusAwaitingForChange = null;
      return;
    }

    if (newStatus !== this.currentStreamStatus) {
      if (this.statusAwaitingForChange == null) {
        this.statusAwaitingForChange = newStatus;
        console.log(`Will change status to ${newStatus} after receiving second confirmation`);
        return;
      }

      console.log(`Received confirmation to change to ${newStatus}`);
      this.statusAwaitingForChange = null;

      console.log(`Trigger status change ===> ${newStatus}`);
      ////////////////////////////////////////////////////////////////////////////////////////
      // console.log('APPS LIST:');
      // apps.forEach(app => {
      //   console.log(`App: ${app.command} - ${app.arguments}`);
      // });
      ////////////////////////////////////////////////////////////////////////////////////////

      if (newStatus == EStreamingState.Live) {
        this.didAutoStartStreaming = true;
      }

      this.currentStreamStatus = newStatus;
      this.onGameStatusChanged(newStatus);
    }
  }

  onGameStatusChanged(status: EStreamingState) {
    console.log(`Game status changed: ${status}`);
    const shouldStart = status === EStreamingState.Live;
    const query = `start=${shouldStart ? 'true' : 'false'}`;
    const url = `me.buffed.app.desktop://autostream?${query}`;

    console.log('openDeeplink', url);
    electron.shell.openExternal(url);
  }
}

const monitor = new GamesMonitor();
export default monitor;

// electron.ipcRenderer.on('AppInitFinished', () => {
// console.log('[GamesMonitor] AppInitFinished.');
monitor.startBackgroundMonitoring();
// });

//////////////////////////////
// Tray
/////////////////////////////
function setupTray() {
  console.log(`Setup tray.`);
  const trayManager = new TrayManager();
  const showApp = async () => {
    await electron.ipcRenderer.invoke('SHOW_APP');
  };
  trayManager.setupTray(app, showApp);
}

setupTray();
