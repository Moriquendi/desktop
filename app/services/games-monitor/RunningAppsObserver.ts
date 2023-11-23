import * as ps from 'ps-node';
import ActiveWindow, { WindowInfo } from '@paymoapp/active-window';

// import { lookup } from './WindowsTasklist';
// @ts-ignore
import * as tasklist from 'tasklist';

export interface RunningAppInfo {
  pid: string;
  command: string;
  arguments: string[]; // on macOS, product path is here
}

interface TaskListInfo {
  imageName: string;
  pid: string;
  sessionName: string;
  sessionNumber: string;
  memUsage: string;
}

export class RunningAppsObserver {
  onRunningAppsChanged: (appsList: RunningAppInfo[]) => void;
  onFocusedWindowChanged: (windowInfo: WindowInfo) => void;
  private observer: NodeJS.Timer | null = null;

  async start() {
    const me = this;
    this.observer = setInterval(async function () {
      console.log(`Check running apps...`);
      const appsList: RunningAppInfo[] = await getRunningApps();
      me.onRunningAppsChanged(appsList);

      const window = await me.getFocusedWindow();
      me.onFocusedWindowChanged(window);
    }, 10 * 1000);
  }

  async stop() {
    this.observer && clearInterval(this.observer);
    this.observer = null;
  }

  async getFocusedWindow(): Promise<WindowInfo> {
    const activeWin = ActiveWindow.getActiveWindow();
    console.log(`Focused window: ${activeWin.path}`);
    return activeWin;
  }
}
var IS_WIN = process.platform === 'win32';
async function getRunningApps(): Promise<RunningAppInfo[]> {
  if (IS_WIN) {
    const out = await tasklist();
    const list = out as TaskListInfo[];

    const mapped = list.map(item => {
      const info: RunningAppInfo = {
        pid: item.pid,
        command: item.imageName,
        arguments: [item.imageName],
      };
      return info;
    });
    return mapped;
  } else {
    return new Promise((resolve, reject) => {
      ps.lookup({}, function (err, resultList) {
        if (err) {
          reject(new Error(err as any));
          return;
        }

        resolve(resultList as any);
      });
    });
  }
}
