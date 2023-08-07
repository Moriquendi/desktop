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

export function BuffedPlatformConnect() {
  const { selectedExtraPlatform, setExtraPlatform } = useModule(LoginModule);
  const { next } = useModule(OnboardingModule);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  //   if (!selectedExtraPlatform) return <div></div>;

  function openHelp() {
    remote.shell.openExternal(platformDefinition.helpUrl);
  }

  async function onFinish() {
    try {
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
      console.error(e);
    }

    next();
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

  return (
    <div className={styles.rootContainer}>
      
      <div className={styles.fancyContainerBackground}> </div>

      <div style={{position: "relative", height: "100%" }}>
        <div className={styles.fancyContainer} style={{height: "100%"}}>
            {/* <p>
              <PlatformLogo platform={'buffed'} />
            </p>
            <h1>{$t('Connect to %{platform}', { platform: platformDefinition.name })}</h1> */}

            <div className="flex flex--center flex--column">
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
              </Form>


            <p>
              <button
                className="button button--action"
                onClick={onFinish}
                disabled={!(email.trim().length > 0 && password.trim().length > 0)}
                style={{minWidth: "300px"}}
              >
                {$t('Sign In')}
              </button>
            </p>
            </div>



            <p>
              {/* <a className={styles['link-button']} onClick={() => next()}>
                {$t('Skip')}
              </a> */}

              {/* <span style={{ display: 'inline-block', width: 32 }}> </span> */}

              {/* <a className={styles['link-button']} onClick={() => setExtraPlatform(undefined)}>
                {$t('Back')}
              </a> */}
            </p>
          </div>
      </div>

      
    </div>
  );
}
