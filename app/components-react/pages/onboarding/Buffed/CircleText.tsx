import React from 'react';

interface Props {
  text: string;
}
export function CircleText({ text }: Props) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        color: 'black',
        width: 65,
        height: 65,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
      }}
    >
      <p>{text}</p>
    </div>
  );
}
