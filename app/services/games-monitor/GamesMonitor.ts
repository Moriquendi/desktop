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

export enum GameStatus {
  NotRunning,
  Running,
}

class GamesMonitor {
  private observer = new RunningAppsObserver();
  private currentStatus: GameStatus = GameStatus.NotRunning;
  private executableNameToGameMap: { [key: string]: GameInfo } = {};
  private statusAwaitingForChange: GameStatus | null = null;

  constructor() {
    console.log('[GamesMonitor] Creating.');

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
    // Wait to make sure everything else is loaded
    await Utils.sleep(5 * 1000);
    console.log('[GamesMonitor] Start observing.');

    this.observer.onRunningAppsChanged = appsList => {
      this.handle(appsList, false, true);
    };
    this.observer.onFocusedWindowChanged = windowInfo => {
      this.handleWindow(windowInfo);
    };
    this.observer.start();
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
    if (this.currentStatus === GameStatus.Running && !allowEnd) {
      return;
    }
    if (this.currentStatus === GameStatus.NotRunning && !allowStart) {
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
        return;
      }

      // TODO: Skip if launcher?
      console.log(`Detected game running: ${matchingGame.name}`);
      return true;
    });

    const isAnyGameRunning = runningGame !== undefined;
    if (isAnyGameRunning) {
      console.log(`Detected game running: ${runningGame}`);
    }

    const newStatus: GameStatus = isAnyGameRunning ? GameStatus.Running : GameStatus.NotRunning;
    if (newStatus !== this.currentStatus) {
      if (this.statusAwaitingForChange == null) {
        this.statusAwaitingForChange = newStatus;
        console.log(`Will change status to ${newStatus} after receiving second confirmation`);
        return;
      }
      if (this.statusAwaitingForChange !== newStatus) {
        console.log('Status changed in the meantime, reset');
        this.statusAwaitingForChange = null;
        return;
      }

      console.log(`Received confirmation to change to ${newStatus}`);
      this.statusAwaitingForChange = null;

      console.log(`Trigger status change ===> ${newStatus}`);
      ////////////////////////////////////////////////////////////////////////////////////////
      console.log('APPS LIST:');
      apps.forEach(app => {
        console.log(`App: ${app.command} - ${app.arguments}`);
      });
      ////////////////////////////////////////////////////////////////////////////////////////

      this.currentStatus = newStatus;
      this.onGameStatusChanged(newStatus);
    }
  }

  onGameStatusChanged(status: GameStatus) {
    console.log(`Game status changed: ${status}`);
    const shouldStart = status === GameStatus.Running;
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
