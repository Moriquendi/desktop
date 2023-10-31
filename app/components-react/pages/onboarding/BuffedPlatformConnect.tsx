import { useModule } from 'slap';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import React, { useState } from 'react';
import { $t } from 'services/i18n';
import { LoginModule } from './Connect';
import styles from './BuffedPlatformConnect.m.less';
import * as remote from '@electron/remote';
import { TextInput } from 'components-react/shared/inputs/TextInput';
import { OnboardingModule } from './Onboarding';
import { Services } from 'components-react/service-provider';
import Form from 'components-react/shared/inputs/Form';
import { BuffedClient } from './BuffedClient';
import { Image, Alert, Button, ConfigProvider, Spin } from 'antd';
import { SocialPlatform, TPlatform } from 'services/platforms';

interface Props {
  onAuth: (email: string, password: string) => Promise<void>;
  authPlatform: (platform: SocialPlatform) => Promise<void>;
}

type Screen = 'auth-method-pick' | 'auth-method-email';

export function BuffedPlatformConnect(props: Props) {
  const onAuth = props.onAuth;
  const { selectedExtraPlatform, setExtraPlatform } = useModule(LoginModule);
  const { next } = useModule(OnboardingModule);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [screen, setScreen] = useState<Screen>('auth-method-pick');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //   if (!selectedExtraPlatform) return <div></div>;

  function openHelp() {
    remote.shell.openExternal(platformDefinition.helpUrl);
  }

  async function onFinish() {
    setIsLoading(true);
    setError(null);

    try {
      await onAuth(email, password);
      next();

      return;
      ////////////////////////////////////////////
      Services.StreamSettingsService.setSettings({
        key: '1231231231231',
        streamType: 'rtmp_custom',
        server: 'buffed.com.elomelo',
      });
      console.log('ok');
      next();
      return;
      ////////////////////////////////////////////

      const buffedClient = new BuffedClient();
      console.error('Signing in to buffed');
      const output = await buffedClient.signIn(email, password);
      console.log(output);
      console.error('Fetching profile....');
      const userProfile = await buffedClient.profile(output.api_key);
      console.log(userProfile);
      console.error('Setting streaming settings for buffed');

      Services.StreamSettingsService.setSettings({
        key: userProfile.buffed_key!,
        streamType: 'rtmp_custom',
        server: platformDefinition.ingestUrl,
      });
    } catch (e) {
      console.log(`Throwed error:`);
      const message = e.error ?? 'Something went wrong. Please try again.';
      // console.log(e.message);
      // console.log(e.error);
      setError(message);
    }

    setIsLoading(false);
  }

  //   const platformDefinition = {
  //     dlive: {
  //       name: 'DLive',
  //       ingestUrl: 'rtmp://stream.dlive.tv/live',
  //       helpUrl: 'https://go.dlive.tv/stream',
  //       icon: 'dlive-white.png',
  //     },
  //     nimotv: {
  //       name: 'Nimo.TV',
  //       ingestUrl: 'rtmp://txpush.rtmp.nimo.tv/live/',
  //       helpUrl: 'https://article.nimo.tv/p/1033/streamlabsprotocol.html',
  //       icon: 'nimo-logo.png',
  //     },
  //     buffed: {
  //       name: 'Buffed',
  //       ingestUrl: '',
  //       helpUrl: '',
  //       icon: 'buffed-logo.png',
  //     },
  //   }[selectedExtraPlatform];

  const platformDefinition = {
    name: 'Buffed',
    ingestUrl: 'rtmp://buffed.live/app',
    helpUrl: '',
    icon: 'buffed-logo.png',
  };

  function EmailMethodButton() {
    return (
      <button
        className="button button--action"
        onClick={() => {
          setScreen('auth-method-email');
        }}
        style={{ minWidth: '300px' }}
      >
        {$t('Log in with Email')}
      </button>
    );
  }

  function AuthMethodButtons() {
    return (
      <VStack>
        <SocialAuthButtons
          onAuth={async p => {
            try {
              setIsLoading(true);
              await props.authPlatform(p);
            } catch {
              console.error('Failed to auth with platform', error);
            }
            setIsLoading(false);
          }}
        />
        <EmailMethodButton />
      </VStack>
    );
  }

  const renderCurrentScreen = () => {
    switch (screen) {
      case 'auth-method-pick':
        return <AuthMethodButtons />;
      case 'auth-method-email':
        return (
          <EmailForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onFinish={onFinish}
          />
        );
    }
  };

  function getNavButtons() {
    return (
      <HStack>
        {screen == 'auth-method-email' && (
          <>
            <a
              className={styles['link-button']}
              onClick={() => {
                setScreen('auth-method-pick');
              }}
            >
              {$t('Back')}
            </a>
            <span style={{ display: 'inline-block', width: 32 }}> </span>
          </>
        )}

        <a className={styles['link-button']} onClick={() => next()}>
          {$t('Skip')}
        </a>
      </HStack>
    );
  }

  function getGuideLink() {
    return (
      <a
        className="link--accent"
        onClick={() => {
          remote.shell.openExternal('https://buffed.me/community/guides/pc/setup_guide');
        }}
      >
        {$t('Buffed Desktop Setup Guide')}
      </a>
    );
  }

  return (
    <div className={styles.rootContainer}>
      <div className={styles.fancyContainerBackground}> </div>

      <div style={{ position: 'relative', height: '100%' }}>
        <div className={styles.fancyContainer} style={{ height: '100%' }}>
          {/* <p>
              <PlatformLogo platform={'buffed'} />
            </p>
            <h1>{$t('Connect to %{platform}', { platform: platformDefinition.name })}</h1> */}

          <div className="flex flex--center flex--column">
            <VStack>
              {error && (
                <div style={{ padding: 8 }}>
                  <Alert message={error} type="error" showIcon />
                </div>
              )}

              {renderCurrentScreen()}

              {isLoading && <Spin />}

              {getNavButtons()}

              {screen == 'auth-method-pick' && <HStack>{getGuideLink()}</HStack>}
            </VStack>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialLogo(props: { social: 'apple' | 'discord' | 'google' }) {
  let className = '';
  switch (props.social) {
    case 'apple':
      className = styles.appleIcon;
      break;
    case 'discord':
      className = styles.discordIcon;
      break;
    case 'google':
      className = styles.googleIcon;
      break;
  }
  return <div className={className} />;
}

interface SocialButtonProps {
  name: string;
  social: 'apple' | 'discord' | 'google';
  onClick: () => Promise<void>;
}

interface ButtonsProps {
  onAuth: (platform: SocialPlatform) => Promise<void>;
}

function VStack(props: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>{props.children}</div>;
}

interface HStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number;
}

function HStack(props: HStackProps) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        gap: props.spacing ?? 30,
        // borderWidth: 2,
        // borderColor: '#fff',
        // borderStyle: 'solid',
        // alignItems: 'center',
        // alignContent: 'flex-end',
        // flexBasis: 'auto',
        // alignItems: 'flex-end',
        // justifyItems: 'flex-end',
        // content: 'fit-content',
        justifyContent: 'center',
      }}
    >
      {props.children}
    </div>
  );
}

function SocialAuthButtons(props: ButtonsProps) {
  const onAuth = props.onAuth;
  return (
    <VStack>
      <SocialButton
        name="Discord"
        social="discord"
        onClick={async () => {
          await onAuth('discord');
        }}
      />
      <SocialButton
        name="Google"
        social="google"
        onClick={async () => {
          await onAuth('google');
        }}
      />
      <SocialButton
        name="Apple"
        social="apple"
        onClick={async () => {
          await onAuth('apple');
        }}
      />
    </VStack>
  );
}

function SocialButton(props: SocialButtonProps) {
  return (
    <button
      className="button button--action"
      onClick={props.onClick}
      style={{
        minWidth: '300px',
        // borderColor: '#ff00ff',
        // borderStyle: 'solid',
        // justifyContent: 'center',
        // alignItems: 'center',
        // alignContent: 'center',
      }}
    >
      <HStack spacing={8}>
        <SocialLogo social={props.social} />
        {$t(`Sign In with ${props.name}`)}
      </HStack>
    </button>
  );
}

interface EmailFormProps {
  email: string;
  setEmail: (email: string) => void;

  password: string;
  setPassword: (password: string) => void;
  onFinish: () => void;
}
function EmailForm({ email, setEmail, password, setPassword, onFinish }: EmailFormProps) {
  return (
    <Form>
      <TextInput
        label={$t('Email')}
        value={email}
        onChange={setEmail}
        isPassword={false}
        uncontrolled={false}
      />
      <TextInput
        label={$t('Password')}
        value={password}
        onChange={setPassword}
        isPassword={true}
        uncontrolled={false}
      />

      <button
        className="button button--action"
        onClick={() => {
          onFinish();
        }}
        disabled={!(email.trim().length > 0 && password.trim().length > 0)}
        style={{ minWidth: '300px' }}
      >
        {$t('Log In')}
      </button>
    </Form>
  );
}
