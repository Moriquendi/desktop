import React from 'react';
import { SocialPlatform } from 'services/platforms';
import { VStack } from './VStack';
import { HStack } from 'components-react/shared/HStack';
import styles from './BuffedPlatformConnect.m.less';
import { $t } from 'services/i18n';

interface ButtonsProps {
  onAuth: (platform: SocialPlatform) => Promise<void>;
}

export function SocialAuthButtons(props: ButtonsProps) {
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

interface SocialButtonProps {
  name: string;
  social: 'apple' | 'discord' | 'google';
  onClick: () => Promise<void>;
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
