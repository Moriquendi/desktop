import React from 'react';

export function VStack(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
        alignItems: 'center',
        justifyItems: 'center',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}
