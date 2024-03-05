import fetch from 'node-fetch';
import { OBSSettings } from '../../../services/settings/BuffedSettingsController';
import * as remote from '@electron/remote';

interface SignInOutput {
  id: number;
  api_key: string;
}

interface UserProfile {
  id: number;
  email: string;
  buffed_key: string | null;
  twitch_key: string | null;
  platform: string | null;

  nickname: string | null;

  obs_settings?: OBSSettings;
}

export class BuffedClient {
  async signIn(email: string, password: string): Promise<SignInOutput> {
    const baseURL = 'https://buffed.me/api/v1/';
    const endpoint = 'users/sign_in';
    const url = `${baseURL}${endpoint}`;

    const body = {
      user: {
        email: email,
        password: password,
      },
    };

    // console.error(`1. url: ${url}`);
    // console.error(`1. body: ${body}`);
    const result = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    // console.error(`2. result: ${result}`);
    // console.error(`3. result: ${result.status}`);
    // console.error(`4. result: ${result.statusText}`);

    try {
      const json = await result.json();
      if (json.id === undefined && json.api_key === undefined) {
        throw new Error('Invalid credentials');
      }

      const output = json as SignInOutput;
      return output;
    } catch (e) {
      throw new Error('Invalid credentials');
    }
  }

  signUp() {
    const endpoint = 'users/sign_up';
  }

  async profile(apiKey: string): Promise<UserProfile> {
    const baseURL = 'https://buffed.me/api/v1/';
    const endpoint = 'users/profile';

    let url = new URL(`${baseURL}${endpoint}`);
    url.searchParams.append('api_key', apiKey);

    console.log(`Fetching profile from ${url}`);

    const appVersion = remote.app.getVersion();
    const result = await fetch(url, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `BuffedDesktop/${appVersion}`,
      },
    });
    const output = (await result.json()) as UserProfile;
    return output;
  }

  async registerStreamStardCommand(apiKey: string, cmd: string) {
    console.log(`Register stream app: ${cmd}`);
    const baseURL = 'https://buffed.me/api/v1/';
    const url = `${baseURL}/game_sessions/start_cmd?api_key=${apiKey}`;
    const body = {
      start_cmd: cmd,
    };

    try {
      const resp = await fetch(url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log(`Register status: ${resp.status}`);
    } catch (error) {
      console.log('Failed to register');
      console.error(error);
    }
  }
}
