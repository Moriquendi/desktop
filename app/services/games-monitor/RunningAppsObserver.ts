import * as ps from 'ps-node';

export interface RunningAppInfo {
  pid: string;
  command: string;
  arguments: string[]; // on macOS, product path is here
}

export class RunningAppsObserver {
  onRunningAppsChanged: (appsList: RunningAppInfo[]) => void;
  private observer: any | null = null;

  async start() {
    const me = this;
    this.observer = setInterval(async function () {
      console.log(`Check running apps...`);
      const appsList: RunningAppInfo[] = await getRunningApps();
      me.onRunningAppsChanged(appsList);
    }, 5 * 1000);
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
