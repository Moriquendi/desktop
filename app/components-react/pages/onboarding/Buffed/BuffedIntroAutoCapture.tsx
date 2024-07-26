import React from 'react';
import * as remote from '@electron/remote';
import { VStack } from './VStack';
import { IntroScreenHeader } from './IntroScreenHeader';
import { ToolbarItems } from './ToolbarItems';

export function BuffedIntroAutoCapture({ onNext }: { onNext: () => void }) {
  function openDiscord() {
    remote.shell.openExternal('https://discord.gg/ysrAn9unC3');
  }

  const helperText = (
    <p style={{ fontSize: '16px', color: '#8E8E93', padding: 0, margin: 0 }}>
      Need any help? Join our{' '}
      <a onClick={openDiscord} style={{ color: '#0984FF' }}>
        Discord!
      </a>
    </p>
  );

  return (
    <VStack
      style={{
        gap: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0B0B0B',
        paddingTop: '32px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}
    >
      <VStack
        style={{
          alignItems: 'center',
          gap: 0,
          paddingTop: '0px',
          width: '100%',
          height: '100%',
        }}
      >
        <IntroScreenHeader
          step={'4.'}
          text={
            'Buffed Desktop App will detect your game and start the capture automatically. You can always start or stop it manually.'
          }
        />
        <div style={{ flexGrow: 1 }} />
        <img
          style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto' }}
          src={require(`./Assets/intro-auto-capture.png`)}
          alt="Starting capture"
        />
        <div style={{ flexGrow: 1 }} />
      </VStack>

      <ToolbarItems centerItem={helperText} onNext={onNext} />
    </VStack>
  );
}
