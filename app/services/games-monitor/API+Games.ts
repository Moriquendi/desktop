import * as remote from '@electron/remote';
import * as fs from 'fs';
import { downloadFile } from 'util/requests';

export interface GameExecutableInfo {
  is_launcher: boolean;
  name: string; // 'exe' name
  os: string;
}

export interface GameInfo {
  executables?: GameExecutableInfo[];
  name: string;
}

export async function fetchGamesList(): Promise<GameInfo[]> {
  try {
    console.log('Read game list from file...');
    const list = await readGamesList();
    console.log('Schedule list refresh');
    // We trigger download in bg to update the list but we don't wait for it.
    downloadAndSaveGamesList();
    return list;
  } catch {
    console.log('Will fetch games.');
    await downloadAndSaveGamesList();
    console.log('Return from disk');
    const list = await readGamesList();
    return list;
  }
}

const appDataDirectory = remote.app.getPath('userData');
const gamesListFileURL = `${appDataDirectory}/games_list.json`;
async function downloadAndSaveGamesList() {
  const url = 'https://discord.com/api/v8/applications/detectable';

  await downloadFile(url, gamesListFileURL);
}

async function readGamesList(): Promise<GameInfo[]> {
  console.log(`Reading from url: ${gamesListFileURL}`);

  return new Promise(async (resolve, reject) => {
    fs.readFile(gamesListFileURL, 'utf8', (err, data) => {
      if (err) {
        //console.error('Error reading JSON file:', err);
        reject(err);
        return;
      }
      const list = JSON.parse(data) as GameInfo[];

      //////////
      list.push(
        // {
        //   executables: [
        //     {
        //       is_launcher: false,
        //       name: 'discord',
        //       os: 'darwin',
        //     },
        //   ],
        //   name: 'Discord',
        // },
        {
          executables: [
            { is_launcher: false, name: 'fortniteclient-win64-shipping_BE.exe', os: 'win32' },
          ],
          name: 'Fortnite manual',
        },
        {
          executables: [
            { is_launcher: false, name: 'fortniteclient-win64-shipping_EAC_EOS.exe', os: 'win32' },
          ],
          name: 'Fortnite manual',
        },
      );
      //////////

      resolve(list);
    });
  });
}
