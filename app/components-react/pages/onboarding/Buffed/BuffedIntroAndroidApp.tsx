import React from 'react';
import { VStack } from './VStack';
import { ToolbarItems } from './ToolbarItems';

export function BuffedIntroAndroidApp({ onBack }: { onBack: () => void }) {
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
          gap: 30,
          paddingTop: '0px',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ flexGrow: 1 }} />
        <img
          style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto' }}
          src={require(`./Assets/android-face.png`)}
          alt="Android logo"
        />
        <p
          style={{
            fontSize: '24px',
            padding: 0,
            margin: 0,
            textAlign: 'center',
            color: 'white',
          }}
        >
          Thanks for showing your interest in Buffed Andorid App. <br />
          We will notify you as soon as the app is released!
        </p>

        <div style={{ flexGrow: 1 }} />
      </VStack>

      <ToolbarItems onBack={onBack} />
    </VStack>
  );
}
