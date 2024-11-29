import React from 'react';

interface Props {
  text: string;
}
export function CircleText({ text }: Props) {
  return (
    <div
      style={{
        backgroundColor: '#D8D8D8',
        color: 'black',
        width: 65,
        height: 65,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        padding: 0,
        margin: 0,
        flexShrink: 0,
      }}
    >
      <p style={{ padding: 0, margin: 0, fontSize: '30px', fontWeight: 'bold' }}>{text}</p>
    </div>
  );
}
