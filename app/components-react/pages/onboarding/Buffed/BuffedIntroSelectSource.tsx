import { VStack } from './VStack';
import React, { useEffect, useState } from 'react';
import { ToolbarItems } from './ToolbarItems';
import * as remote from '@electron/remote';
import { IntroScreenHeader } from './IntroScreenHeader';
import { HStack } from 'components-react/shared/HStack';
import { CheckboxInput } from 'components-react/shared/inputs';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import Display from 'components-react/shared/Display';
import { ERenderingMode } from 'obs-studio-node';
import { first } from 'lodash';
import { BuffedCaptureSource } from 'services/settings/BuffedSettingsController';
import { Services } from 'components-react/service-provider';

export function BuffedIntroSelectSource({ onNext }: { onNext: () => void }) {
  const [source, setSource] = useState<BuffedCaptureSource>('game');
  const { BuffedService, SourcesService } = Services;

  useEffect(() => {
    const activeSource = BuffedService.activeSourceType;
    setSource(activeSource ?? 'display');
  }, []);

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
          step={'2.'}
          text={
            'While your game is running go back to Buffed Windows App (Alt-Tab) and choose your capture source:'
          }
        />
        <div style={{ flexGrow: 1 }} />
        <SourcesPicker
          source={source}
          setSource={async source => {
            setSource(source);

            await BuffedService.setBuffedCaptureSource(source);
          }}
        />

        <div style={{ flexGrow: 1 }} />
      </VStack>

      <ToolbarItems centerItem={helperText} onNext={onNext} />
    </VStack>
  );
}

function DisplayPreview() {
  return (
    <Display
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}

interface SourcesPickerProps {
  source: BuffedCaptureSource;
  setSource: (source: BuffedCaptureSource) => void;
}

function SourcesPicker({ source, setSource }: SourcesPickerProps) {
  return (
    <HStack spacing={60} style={{ width: '100%', height: '100%' }}>
      <SourceItem
        title="Game Capture"
        subtitle="Game Capture should only capture game running in Full Screen or Windowed Full Screen mode."
        isSelected={source === 'game'}
        setIsSelected={isSelected => {
          setSource('game');
        }}
      />
      <SourceItem
        title="Display Capture"
        subtitle="Beware that Display Capture will capture everything on your screen."
        isSelected={source === 'display'}
        setIsSelected={isSelected => {
          setSource('display');
        }}
      />
    </HStack>
  );
}

interface SourceItemProps {
  title: string;
  subtitle: string;
  isSelected: boolean;
  setIsSelected: (isSelected: boolean) => void;
}
function SourceItem({ title, subtitle, isSelected, setIsSelected }: SourceItemProps) {
  return (
    <VStack spacing={15} style={{ width: 315 }}>
      <p style={{ fontSize: '18px', color: '#8E8E93', padding: 0, margin: 0 }}>{title}</p>

      <div style={{ width: '100%', height: 180, backgroundColor: 'black' }}>
        {isSelected ? <DisplayPreview /> : null}
      </div>

      <p style={{ fontSize: '14px', color: '#8E8E93', padding: 0, margin: 0 }}>{subtitle}</p>
      <CheckboxInput
        label={
          // <p style={{ fontSize: '20px', color: '#8E8E93', paddingTop: 5, margin: 0 }}>Select</p>
          $t('Select')
        }
        value={isSelected}
        onChange={val => {
          setIsSelected(val);
        }}
      />
    </VStack>
  );
}
