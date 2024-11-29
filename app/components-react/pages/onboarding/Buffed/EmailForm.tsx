import React from 'react';
import Form from 'components-react/shared/inputs/Form';
import { TextInput } from 'components-react/shared/inputs/TextInput';
import { $t } from 'services/i18n';
import styles from './BuffedPlatformConnect.m.less';
import * as remote from '@electron/remote';

interface EmailFormProps {
  email: string;
  setEmail: (email: string) => void;

  password: string;
  setPassword: (password: string) => void;
  ctaTitle: string;
  onFinish: () => void;

  showForgotPassword: boolean;
}

export function EmailForm({
  email,
  setEmail,
  password,
  setPassword,
  ctaTitle,
  onFinish,
  showForgotPassword,
}: EmailFormProps) {
  return (
    <Form layout="vertical">
      <TextInput
        label={$t('Email')}
        value={email}
        onChange={setEmail}
        isPassword={false}
        uncontrolled={false}
      />
      <TextInput
        label={$t('Password')}
        value={password}
        onChange={setPassword}
        isPassword={true}
        uncontrolled={false}
      />

      {showForgotPassword && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            paddingBottom: '15px',
          }}
        >
          <a
            className={styles.linkButton}
            onClick={() => {
              remote.shell.openExternal('https://buffed.me/users/reset_password');
            }}
          >
            <h3>Forgot Password?</h3>
          </a>
        </div>
      )}

      <button
        className="button button--action"
        onClick={() => {
          onFinish();
        }}
        disabled={!(email.trim().length > 0 && password.trim().length > 0)}
        style={{ minWidth: '300px' }}
      >
        {ctaTitle}
      </button>
    </Form>
  );
}
