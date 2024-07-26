import { HStack } from 'components-react/shared/HStack';
import React from 'react';
import { CircleText } from './CircleText';

interface HeaderProps {
  step: string;
  text: string;
}
export function IntroScreenHeader({ step, text }: HeaderProps) {
  return (
    <HStack
      spacing={25}
      style={{
        width: '100%',
      }}
    >
      <CircleText text={step} />
      <h1 style={{ fontSize: '24px', fontWeight: 'normal', padding: 0, margin: 0 }}>{text}</h1>
      <div style={{ flexGrow: 1 }} />
    </HStack>
  );
}
