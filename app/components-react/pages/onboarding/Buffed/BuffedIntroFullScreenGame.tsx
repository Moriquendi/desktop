import { HStack } from 'components-react/shared/HStack';
import { VStack } from './VStack';
import React from 'react';
import { ToolbarItems } from './ToolbarItems';
import { CircleText } from './CircleText';

export function BuffedIntroFullScreenGame({ onNext }: { onNext: () => void }) {
  return (
    <VStack style={{ gap: 0, width: '100%', height: '100%', backgroundColor: '#0B0B0B' }}>
      <div style={{ flexGrow: 1 }} />

      <HStack
        style={{
          // flexGrow: 1,
          height: '100%',
          overflow: 'hidden',
          padding: '32px',
          gap: 60,
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
        }}
      >
        <div style={{ flexGrow: 1 }} />
        <VStack
          style={{
            alignItems: 'center',
            gap: 55,
          }}
        >
          <HStack spacing={25}>
            <CircleText text="1." />
            <h2>
              Start your game and please make sure it runs in Full Screen or Windowed Full Screen
              mode.
            </h2>
          </HStack>

          <img
            style={{ height: 330, maxHeight: '100%', maxWidth: '100%', width: 'auto' }}
            src={require(`./Assets/intro-game-fullscren.png`)}
            alt="Set game settings to full screen"
          />
        </VStack>

        <div style={{ flexGrow: 1 }} />
      </HStack>

      <div style={{ flexGrow: 1 }} />

      <p>
        Need any help? Join our <a href="https://google.pl">Discord!</a>
      </p>

      <ToolbarItems onNext={onNext} />
    </VStack>
  );
}
