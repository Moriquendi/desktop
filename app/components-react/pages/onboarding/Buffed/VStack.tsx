import React from 'react';

export interface VStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number;
  style?: React.CSSProperties;
}

export function VStack(props: VStackProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: props.spacing ?? 30,
        alignItems: 'center',
        justifyItems: 'center',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}
