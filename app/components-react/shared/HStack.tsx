import React, { HTMLAttributes } from 'react';

export interface HStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number;
  style?: React.CSSProperties;
}

export function HStack(props: HStackProps) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        gap: props.spacing ?? 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

export function Spacer() {
  return (
    <div
      style={{
        flexGrow: 1,
        alignSelf: 'stretch',
        justifySelf: 'stretch',
      }}
    />
  );
}
