import { TrayManager } from 'Tray/TrayManager';
import { GAMES_LIST } from './GamesList';
import { RunningAppInfo, RunningAppsObserver } from './RunningAppsObserver';
import path from 'path';
import electron from 'electron';
import * as remote from '@electron/remote';
import Utils from 'services/utils';
const { app } = remote;

export enum GameStatus {
  NotRunning,
  Running,
}

class GamesMonitor {
  private observer = new RunningAppsObserver();
  private exeNames: Set<string>;
  private currentStatus: GameStatus = GameStatus.NotRunning;

  constructor() {
    console.log('[GamesMonitor] Creating.');

    this.exeNames = new Set(GAMES_LIST.map(game => game.exe.toLowerCase()));
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
    const runningPaths = apps.map(app => app.command);

    const runningGame = runningPaths.find(thePath => {
      const fileName = path.basename(thePath);
      const isAGame = this.exeNames.has(fileName.toLowerCase());

      return isAGame;
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
    window.open(url);
  }
}

const monitor = new GamesMonitor();
export default monitor;

electron.ipcRenderer.on('AppInitFinished', () => {
  console.log('[GamesMonitor] AppInitFinished.');
  monitor.startBackgroundMonitoring();
});

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
