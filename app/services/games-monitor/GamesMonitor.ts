import { TrayManager } from 'Tray/TrayManager';

import { RunningAppInfo, RunningAppsObserver } from './RunningAppsObserver';
import path from 'path';
import electron from 'electron';
import * as remote from '@electron/remote';
import Utils from 'services/utils';
import { OS, byOS } from 'util/operating-systems';
import { first } from 'lodash';
import { GameInfo, fetchGamesList } from './API+Games';
const { app } = remote;

export enum GameStatus {
  NotRunning,
  Running,
}

class GamesMonitor {
  private observer = new RunningAppsObserver();
  private currentStatus: GameStatus = GameStatus.NotRunning;
  private executableNameToGameMap: { [key: string]: GameInfo } = {};

  constructor() {
    console.log('[GamesMonitor] Creating.');

    new Promise(async (resolve, reject) => {
      console.log('Download games list...');
      const gamesList = await fetchGamesList();
      console.log(`Games list downloaded. ${gamesList.length} games.`);

      gamesList.forEach(game => {
        game.executables?.forEach(executable => {
          const name = path.basename(executable.name).toLocaleLowerCase();
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
      this.handle(appsList);
    };
    this.observer.start();
  }

  handle(apps: RunningAppInfo[]) {
    const isMac = byOS({ [OS.Windows]: false, [OS.Mac]: true });
    const runningPaths = apps.map(app =>
      isMac ? first(app.arguments) ?? app.command : app.command,
    );

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
