import { useModule } from 'slap';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import React, { HTMLAttributes, useState } from 'react';
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
import { HStack } from 'components-react/shared/HStack';

interface Props {
  onAuth: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  authPlatform: (platform: SocialPlatform) => Promise<void>;
}

type Screen =
  | 'auth-method-pick'
  | 'auth-method-email'
  | 'auth-signup'
  | 'intro-screen'
  | 'download-app';

export function BuffedPlatformConnect(props: Props) {
  const { onAuth, onRegister } = props;
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

  async function onFinish(isRegister: boolean) {
    setScreen('intro-screen');
    return;
    //////////////////////////

    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onAuth(email, password);
      }

      setScreen('intro-screen');
      //
      //next();
      //
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

  function SignUpButton() {
    return (
      <button
        className="button button--action"
        onClick={() => {
          setScreen('auth-signup');
        }}
        style={{ minWidth: '300px' }}
      >
        {$t('Register with Email')}
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
        <SignUpButton />
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
            ctaTitle={$t('Log In')}
            onFinish={() => onFinish(false)}
          />
        );
      case 'auth-signup':
        return (
          <EmailForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            ctaTitle={$t('Register')}
            onFinish={() => onFinish(true)}
          />
        );
      case 'intro-screen':
        return <IntroScreen />;
      case 'download-app':
        return <DownloadAppScreen />;
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
        <div
          className={styles.fancyContainer}
          style={{ height: '100%', backgroundColor: 'orange' }}
        >
          {/* <p>
              <PlatformLogo platform={'buffed'} />
            </p>
            <h1>{$t('Connect to %{platform}', { platform: platformDefinition.name })}</h1> */}

          {/* <div className="flex flex--center flex--column" style={{ backgroundColor: 'purple' }}> */}
          <VStack style={{ backgroundColor: 'red', height: '100%' }}>
            {error && (
              <div style={{ padding: 8 }}>
                <Alert message={error} type="error" showIcon />
              </div>
            )}

            <div style={{ backgroundColor: 'green', flexGrow: 1 }}>{renderCurrentScreen()}</div>

            {isLoading && <Spin />}

            {getNavButtons()}

            {screen == 'auth-method-pick' && <HStack>{getGuideLink()}</HStack>}
          </VStack>
          {/* </div> */}
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

function VStack(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
        ...props.style,
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
  ctaTitle: string;
  onFinish: () => void;
}
function EmailForm({ email, setEmail, password, setPassword, ctaTitle, onFinish }: EmailFormProps) {
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
        {ctaTitle}
      </button>
    </Form>
  );
}

function IntroScreen({}: {}) {
  return (
    // <div style={{ height: '100%', backgroundColor: 'brown' }}>
    <HStack
      style={{
        // flexGrow: 1,
        height: '100%',
        backgroundColor: 'green',
      }}
    >
      <VStack>
        <h2>Play on PCx</h2>

        <img
          style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto', height: 'auto' }}
          src={require(`../../../../media/images/buffed-onboarding/pc-play-intro-screen.png`)}
          alt="Play on PC"
        />
      </VStack>
      <VStack
        style={{
          height: '100%',
          backgroundColor: 'magenta',
          overflow: 'hidden',
        }}
      >
        <h1>Use on iOS</h1>

        <img
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          src={require('./Assets/ios-play-intro-screen.png')}
          alt="Use on iOS"
        />
      </VStack>
    </HStack>
    // </div>
  );
}

function DownloadAppScreen({}: {}) {
  return (
    <VStack>
      <img src={require(`../../../../media/images/buffed-onboarding/pc-play-intro-screen.png`)} />
      <img src={require(`../../../../media/images/buffed-onboarding/pc-play-intro-screen.png`)} />
    </VStack>
  );
}
