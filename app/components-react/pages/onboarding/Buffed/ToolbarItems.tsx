import { HStack, Spacer } from 'components-react/shared/HStack';
import React from 'react';
import styles from './BuffedPlatformConnect.m.less';
import { $t } from 'services/i18n';

export function ToolbarItems(props: {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  centerItem?: React.ReactNode;
  leftItem?: React.ReactNode;
}) {
  const { onNext, onBack, onSkip, leftItem, centerItem } = props;
  return (
    <HStack
      style={{
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 20,
        paddingBottom: 20,
      }}
    >
      {leftItem && <>{leftItem}</>}
      {onBack && (
        <a
          className={styles.linkButton}
          onClick={() => {
            onBack();
          }}
        >
          {$t('Back')}
        </a>
      )}
      <Spacer />

      {centerItem && <>{centerItem}</>}

      {onSkip && (
        <a className={styles.linkButton} onClick={() => onSkip()}>
          {$t('Skip')}
        </a>
      )}
      <Spacer />

      {onNext && (
        <a className={styles.linkButton} onClick={() => onNext()}>
          {$t('Next')}
        </a>
      )}
    </HStack>
  );
}
