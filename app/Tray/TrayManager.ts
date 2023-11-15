import electron from 'electron';
import * as remote from '@electron/remote';
import { getSharedResource } from 'util/get-shared-resource';
const { Tray, Menu, nativeImage } = remote;
let tray;

export class TrayManager {
  setupTray(app: any, onShowApp: () => void) {
    app.whenReady().then(() => {
      const p = getSharedResource('icon-tray.png');

      console.log(p);
      const icon = nativeImage.createFromPath(p);

      console.log(`'make tray`);
      console.log(electron);
      console.log(icon);
      tray = new Tray(icon);
      console.log(`'make tray end`);

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open Buffed',
          type: 'normal',
          click: () => {
            console.log(`Showing main window...`);
            onShowApp();
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          type: 'normal',
          click: async () => {
            console.log('Invoke shutdown');
            try {
              await electron.ipcRenderer.invoke('BEGIN_SHUTDOWN');
            } catch {
              console.error('Failed to call shutdown');
            }
          },
        },
      ]);

      tray.setContextMenu(contextMenu);
    });
  }
}
