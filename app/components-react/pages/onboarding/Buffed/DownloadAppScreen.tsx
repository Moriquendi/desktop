import React from 'react';
import { VStack } from './VStack';
import * as remote from '@electron/remote';
import { ToolbarItems } from './ToolbarItems';
import styles from './BuffedPlatformConnect.m.less';
import { HStack, Spacer } from 'components-react/shared/HStack';

export function DownloadAppScreen({
  onRequestAndroid,
  onNext,
}: {
  onRequestAndroid: () => void;
  onNext: () => void;
}) {
  return (
    <VStack style={{ gap: 0, width: '100%', height: '100%' }}>
      <VStack style={{ gap: 30, height: '100%', justifyContent: 'center' }}>
        <img
          style={{ width: '240px', height: '240px', objectFit: 'contain' }}
          src={require(`./Assets/download-qr.png`)}
        />
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
        <HStack style={{ width: '100%' }}>
          <a className={styles.linkButton} onClick={() => onRequestAndroid()}>
            <HStack spacing={3}>
              <p>
                Request Android
                <img
                  style={{ height: '17px' }}
                  src={require(`./Assets/android-face.png`)}
                  alt="Android logo"
                />
                App
              </p>

              {/* <p>App</p> */}
            </HStack>
          </a>
          <Spacer />
          <ToolbarItems onNext={onNext} />
        </HStack>
      </div>
    </VStack>
  );
}
