export interface OBSSettings {
  width: string;
  height: string;
  fps: string;
  rate_control: string;
  bitrate: string;
  max_bitrate: string;
  keyint_sec: string;
  preset: string;
  profile: string;
  tune: string;
  auto_streaming: boolean;
}

export interface UserProfile {
  id: number;
  email: string;
  buffed_key: string | null;
  twitch_key: string | null;
  platform: string | null;
  created_at: string;
  signed_up_via: 'windows_app' | 'web' | 'ios';

  nickname: string | null;

  obs_settings?: OBSSettings;
}
