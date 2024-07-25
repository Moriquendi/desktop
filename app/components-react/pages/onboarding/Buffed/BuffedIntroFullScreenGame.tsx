import { HStack } from 'components-react/shared/HStack';
import { VStack } from './VStack';
import React from 'react';
import { ToolbarItems } from './ToolbarItems';
import { CircleText } from './CircleText';
import * as remote from '@electron/remote';

export function BuffedIntroFullScreenGame({ onNext }: { onNext: () => void }) {
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
          height: '100%',
        }}
      >
        <IntroScreenHeader
          step={'1.'}
          text={
            'Start your game and please make sure it runs in Full Screen or Windowed Full Screen mode.'
          }
        />
        <div style={{ flexGrow: 1 }} />
        <img
          style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto' }}
          src={require(`./Assets/intro-game-fullscren.png`)}
          alt="Set game settings to full screen"
        />
        <div style={{ flexGrow: 1 }} />
      </VStack>

      <ToolbarItems centerItem={helperText} onNext={onNext} />
    </VStack>
  );
}

interface HeaderProps {
  step: string;
  text: string;
}
function IntroScreenHeader({ step, text }: HeaderProps) {
  return (
    <HStack spacing={25}>
      <CircleText text={step} />
      <h1 style={{ fontSize: '24px', fontWeight: 'normal', padding: 0, margin: 0 }}>{text}</h1>
    </HStack>
  );
}
