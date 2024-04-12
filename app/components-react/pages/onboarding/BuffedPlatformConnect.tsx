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
import { HStack, Spacer } from 'components-react/shared/HStack';

interface Props {
  onAuth: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  authPlatform: (platform: SocialPlatform) => Promise<void>;
}

type Screen =
  | 'auth-method-pick'
  | 'auth-method-email'
  | 'auth-signup'
  | 'switch-platform'
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

  const { BuffedService, UserService } = Services;

  //   if (!selectedExtraPlatform) return <div></div>;

  function openHelp() {
    remote.shell.openExternal(platformDefinition.helpUrl);
  }

  async function onPerformSocialAuth(p: SocialPlatform) {
    try {
      await props.authPlatform(p);
      setScreen('intro-screen');
    } catch {
      console.error('Failed to auth with platform', error);
      setError(error ?? 'Failed to auth with platform');
    }
  }

  async function onPerformAuth(isRegister: boolean) {
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onAuth(email, password);
      }

      goNextScreenAfterAuth();
    } catch (e) {
      console.log(`Throwed error:`);
      const message = e.error ?? 'Something went wrong. Please try again.';
      setError(message);
    }

    setIsLoading(false);
  }

  function goNextScreenAfterAuth() {
    console.log('Buffed service ', BuffedService.views.profile);
    console.log('User service ', UserService.views.isPrime);
    console.log('In UI profile ', BuffedService.state.profile?.platform);
    console.log('In UI profile by view ', BuffedService.views.profile?.platform);

    if (BuffedService.state.profile?.platform == 'pc') {
      console.log('Go to intro screen.');
      setScreen('intro-screen');
    } else {
      console.log('Go to switch platform.');
      setScreen('switch-platform');
    }
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

  function AuthMethodButtons({ onSkip }: { onSkip: () => void }) {
    return (
      <VStack style={{ gap: 0, height: '100%' }}>
        <Spacer />

        <VStack>
          <SocialAuthButtons
            onAuth={async p => {
              await onPerformSocialAuth(p);
            }}
          />
          <EmailMethodButton />
          <SignUpButton />
          {isLoading && <Spin />}
        </VStack>
        <Spacer />

        <ToolbarItems onSkip={onSkip} />
      </VStack>
    );
  }

  const renderCurrentScreen = () => {
    switch (screen) {
      case 'auth-method-pick':
        return <AuthMethodButtons onSkip={next} />;
      case 'auth-method-email':
        return (
          <VStack style={{ width: '100%', height: '100%', gap: 0 }}>
            <Spacer />

            <VStack>
              <EmailForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                ctaTitle={$t('Log In')}
                onFinish={() => onPerformAuth(false)}
              />
              {isLoading && <Spin />}
            </VStack>
            <Spacer />
            <ToolbarItems
              onBack={() => {
                setScreen('auth-method-pick');
              }}
            />
          </VStack>
        );
      case 'auth-signup':
        return (
          <VStack style={{ width: '100%', height: '100%', gap: 0 }}>
            <Spacer />
            <VStack>
              <EmailForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                ctaTitle={$t('Register')}
                onFinish={() => onPerformAuth(true)}
              />
              {isLoading && <Spin />}
            </VStack>
            <Spacer />
            <ToolbarItems
              onBack={() => {
                setScreen('auth-method-pick');
              }}
            />
          </VStack>
        );
      case 'intro-screen':
        return (
          <IntroScreen
            onNext={() => {
              setScreen('download-app');
            }}
          />
        );
      case 'download-app':
        return (
          <DownloadAppScreen
            onNext={() => {
              next();
            }}
          />
        );
      case 'switch-platform':
        return (
          <SwitchPlatformScreen
            isLoading={isLoading}
            onNext={async () => {
              setIsLoading(true);
              try {
                await BuffedService.fetchUserInfo();
              } catch {}
              setIsLoading(false);
              goNextScreenAfterAuth();
            }}
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
      {screen == 'auth-method-pick' && <div className={styles.fancyContainerBackground} />}

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div className={styles.fancyContainer} style={{ width: '100%', height: '100%' }}>
          {/* <p>
              <PlatformLogo platform={'buffed'} />
            </p>
            <h1>{$t('Connect to %{platform}', { platform: platformDefinition.name })}</h1> */}

          {/* <div className="flex flex--center flex--column" style={{ backgroundColor: 'purple' }}> */}
          <VStack style={{ width: '100%', height: '100%' }}>
            {error && (
              <div style={{ padding: 8 }}>
                <Alert message={error} type="error" showIcon />
              </div>
            )}

            {renderCurrentScreen()}

            {/* {getNavButtons()} */}

            {/* {screen == 'auth-method-pick' && <HStack>{getGuideLink()}</HStack>} */}
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
        alignItems: 'center',
        justifyItems: 'center',
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
    <Form layout="vertical">
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

      {/* <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        
        <a className={styles.linkButton}
          onClick={() => {
            remote.shell.openExternal(
              '',
            )
          }}>Forgot Password?</a>
      </div> */}

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

function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    // <div style={{ height: '100%', backgroundColor: 'brown' }}>
    <VStack style={{ gap: 0, width: '100%' }}>
      <HStack
        style={{
          // flexGrow: 1,
          height: '100%',
          overflow: 'hidden',
          padding: '32px',
          gap: 60,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ flexGrow: 1 }} />
        <VStack style={{ flexGrow: 1, alignItems: 'center', gap: 60 }}>
          <h1>Play on PC</h1>

          <img
            style={{ height: 330, maxHeight: '100%', maxWidth: '100%', width: 'auto' }}
            src={require(`./Assets/pc-play-intro-screen.png`)}
            alt="Play on PC"
          />
        </VStack>

        <img
          style={{ width: 'auto', height: '40px' }}
          src={require('./Assets/intro-link-icon.png')}
        />

        <VStack
          style={{
            flexGrow: 1,
            height: '100%',
            overflow: 'hidden',
            alignItems: 'center',
            gap: 60,
          }}
        >
          <h1>Use on iOS</h1>

          <div style={{ overflow: 'hidden' }}>
            <img
              style={{ height: 330, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              src={require('./Assets/ios-play-intro-screen.png')}
              alt="Use on iOS"
            />
          </div>
        </VStack>

        <div style={{ flexGrow: 1 }} />
      </HStack>
      <ToolbarItems onNext={onNext} />
    </VStack>
  );
}

function DownloadAppScreen({ onNext }: { onNext: () => void }) {
  return (
    <VStack style={{ gap: 0, width: '100%', height: '100%' }}>
      <VStack style={{ gap: 30, height: '100%', justifyContent: 'center' }}>
        <img src={require(`./Assets/download-qr.png`)} />
        <a
          onClick={() =>
            remote.shell.openExternal(
              'https://apps.apple.com/us/app/buffed-clip-gaming-adventures/id6467634856',
            )
          }
        >
          <img src={require(`./Assets/download-badge.png`)} />
        </a>
      </VStack>

      <div style={{ width: '100%' }}>
        <ToolbarItems onNext={onNext} />
      </div>
    </VStack>
  );
}

function ToolbarItems(props: { onNext?: () => void; onBack?: () => void; onSkip?: () => void }) {
  const { onNext, onBack, onSkip } = props;
  return (
    <HStack
      style={{
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 20,
        paddingBottom: 20,
      }}
    >
      {onBack && (
        <a
          className={styles.linkButton}
          onClick={() => {
            onBack();
          }}
        >
          {$t('Back')}
        </a>
      )}
      <Spacer />
      {onSkip && (
        <a className={styles.linkButton} onClick={() => onSkip()}>
          {$t('Skip')}
        </a>
      )}
      <Spacer />

      {onNext && (
        <a className={styles.linkButton} onClick={() => onNext()}>
          {$t('Next')}
        </a>
      )}
    </HStack>
  );
}

function SwitchPlatformScreen({ isLoading, onNext }: { isLoading: boolean; onNext: () => void }) {
  return (
    // <div style={{ height: '100%', backgroundColor: 'brown' }}>
    <VStack style={{ gap: 0, width: '100%' }}>
      <h2>Currently your Buffed is configured to work with console.</h2>
      <h1>To use Buffed with PC please change it in Buffed mobile app.</h1>
      <HStack
        style={{
          // flexGrow: 1,
          height: '100%',
          overflow: 'hidden',
          padding: '32px',
          gap: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ flexGrow: 1 }} />
        <VStack style={{ flexGrow: 1, alignItems: 'center', gap: 10 }}>
          <h3>Go to Settings</h3>

          <img
            style={{ height: 340, maxHeight: '100%', maxWidth: '100%', width: 'auto' }}
            src={require(`./Assets/howto-setup-1.png`)}
          />
        </VStack>

        <img
          style={{ width: 'auto', height: '23px' }}
          src={require('./Assets/arrow-right-buffed.png')}
        />

        <VStack
          style={{
            flexGrow: 1,
            height: '100%',
            overflow: 'hidden',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <h3>Start Setup Again</h3>

          <div style={{ overflow: 'hidden' }}>
            <img
              style={{ height: 340, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              src={require('./Assets/howto-setup-2.png')}
            />
          </div>
        </VStack>

        <div style={{ flexGrow: 1 }} />
      </HStack>

      <HStack
        style={{
          justifyContent: 'space-between',
          paddingLeft: 40,
          paddingRight: 40,
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <Spacer />
        {isLoading && <Spin />}

        <a className={styles.linkButton} onClick={() => onNext()}>
          {$t('Ok, Try Again')}
        </a>
      </HStack>
    </VStack>
  );
}
