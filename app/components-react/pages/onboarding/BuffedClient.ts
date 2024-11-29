import fetch from 'node-fetch';
import * as remote from '@electron/remote';
import { UserProfile } from './BuffedTypes';

interface SignInOutput {
  id: number;
  api_key: string;
}

export class BuffedClient {
  async register(email: string, password: string): Promise<SignInOutput> {
    return await this.authCall(email, password, 'users/sign_up');
  }

  async signIn(email: string, password: string): Promise<SignInOutput> {
    return await this.authCall(email, password, 'users/sign_in');
  }

  private async authCall(email: string, password: string, endpoint: string): Promise<SignInOutput> {
    const baseURL = 'https://buffed.me/api/v1/';
    const url = `${baseURL}${endpoint}`;

    const body = {
      user: {
        email: email,
        password: password,
        password_confirmation: password,
      },
    };

    const result = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

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

  async requestAndroid(apiKey: string) {
    const baseURL = 'https://buffed.me/api/v1/';
    const endpoint = 'android_requests';

    let url = new URL(`${baseURL}${endpoint}`);
    url.searchParams.append('api_key', apiKey);

    const body = {};
    const result = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Request android output: ', result);
  }

  async updateProfile(apiKey: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const baseURL = 'https://buffed.me/api/v1/';
    const endpoint = 'users/update';

    let url = new URL(`${baseURL}${endpoint}`);
    url.searchParams.append('api_key', apiKey);

    const body = {
      user: profile,
    };

    const result = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const output = (await result.json()) as UserProfile;
    return output;
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
