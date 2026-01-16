import React from 'react';
import * as remote from '@electron/remote';
import { VStack } from './VStack';
import { IntroScreenHeader } from './IntroScreenHeader';
import { ToolbarItems } from './ToolbarItems';
import { HStack } from 'components-react/shared/HStack';

export function BuffedIntroEnjoy({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  function openDiscord() {
    remote.shell.openExternal('https://discord.gg/ysrAn9unC3');
  }

  const helperText = (
    <HStack spacing={10}>
      <p style={{ fontSize: '24px', color: '#FFFFFF', padding: 0, margin: 0 }}>
        Need help?{' '}
        <a onClick={openDiscord} style={{ color: '#0984FF' }}>
          Join our Discord!
        </a>
      </p>

      <img
        style={{ width: 'auto', height: '20px' }}
        src={require(`./Assets/discord-logo-white.png`)}
        alt="Discord logo"
      />
    </HStack>
  );

  return (
    <VStack
      style={{
        gap: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0B0B0B',
        paddingTop: '32px',
      }}
    >
      <VStack
        style={{
          alignItems: 'center',
          gap: 0,
          paddingTop: '0px',
          paddingLeft: '32px',
          paddingRight: '32px',
          width: '100%',
          height: '100%',
        }}
      >
        <IntroScreenHeader step={'5.'} text={'Enjoy!'} />
        <div style={{ flexGrow: 1 }} />
        {helperText}
        <div style={{ flexGrow: 1 }} />
      </VStack>

      <ToolbarItems onBack={onBack} onNext={onNext} />
    </VStack>
  );
}
