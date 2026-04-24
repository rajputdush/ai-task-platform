import React from 'react';

const styles = {
  fullscreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg)',
  },
  inline: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 36, height: 36,
    border: '3px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};

export default function Spinner({ fullscreen = false, size = 36 }) {
  return (
    <div style={fullscreen ? styles.fullscreen : styles.inline}>
      <div style={{ ...styles.ring, width: size, height: size }} />
    </div>
  );
}
