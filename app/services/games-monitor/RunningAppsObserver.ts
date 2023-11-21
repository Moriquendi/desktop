import * as ps from 'ps-node';
import ActiveWindow, { WindowInfo } from '@paymoapp/active-window';

export interface RunningAppInfo {
  pid: string;
  command: string;
  arguments: string[]; // on macOS, product path is here
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

  async getFocusedWindow(): Promise<WindowInfo> {
    const activeWin = ActiveWindow.getActiveWindow();
    console.log(`Focused window: ${JSON.stringify(activeWin)}`);
    return activeWin;
  }
}
function getRunningApps(): Promise<RunningAppInfo[]> {
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
