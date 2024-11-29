import React from 'react';
import { VStack } from './VStack';
import { Spacer } from 'components-react/shared/HStack';
import { EmailForm } from './EmailForm';
import { $t } from 'services/i18n';
import { Spin } from 'antd';
import { ToolbarItems } from './ToolbarItems';

interface Props {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onPerformAuth: (a: boolean) => void;
  isLoading: boolean;
  onBack: () => void;
}

export function BuffedAuthSignUp({
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
          ctaTitle={$t('Register')}
          onFinish={() => onPerformAuth(true)}
          showForgotPassword={false}
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
