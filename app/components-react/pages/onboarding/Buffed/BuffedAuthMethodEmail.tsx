import React from 'react';
import { Spacer } from 'components-react/shared/HStack';
import { VStack } from './VStack';
import { EmailForm } from './EmailForm';
import { $t } from 'services/i18n';
import { Spin } from 'antd';
import { ToolbarItems } from './ToolbarItems';

interface Props {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (email: string) => void;
  onPerformAuth: (a: boolean) => void;
  isLoading: boolean;
  onBack: () => void;
}

export function BuffedAuthMethodEmail({
  email,
  setEmail,
  password,
  setPassword,
  onPerformAuth,
  isLoading,
  onBack,
}: Props) {
  return (
    <VStack style={{ width: '100%', height: '100%', gap: 0 }}>
      <Spacer />

      <VStack>
        <EmailForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          ctaTitle={$t('Log In')}
          onFinish={() => onPerformAuth(false)}
          showForgotPassword={true}
        />
        {isLoading && <Spin />}
      </VStack>
      <Spacer />
      <ToolbarItems
        onBack={() => {
          onBack();
        }}
      />
    </VStack>
  );
}
