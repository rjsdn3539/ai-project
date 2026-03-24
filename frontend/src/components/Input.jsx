import { useState } from 'react'

function Input({ label, error, hint, style: styleProp, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 7,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '-0.01em',
          color: error ? 'var(--danger)' : focused ? 'var(--primary)' : 'var(--text)',
          transition: 'color 0.15s ease',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '11px 14px',
          border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 10,
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          background: 'var(--surface)',
          color: 'var(--text)',
          letterSpacing: '-0.01em',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: error
            ? '0 0 0 3px rgba(220,38,38,0.1)'
            : focused
              ? '0 0 0 3px rgba(124,106,240,0.12)'
              : 'none',
          fontFamily: 'inherit',
          ...styleProp,
        }}
        onFocus={(e) => { setFocused(true);  props.onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e)  }}
        {...props}
      />
      {error && (
        <p style={{
          color: 'var(--danger)', fontSize: 12, marginTop: 6,
          display: 'flex', alignItems: 'center', gap: 5,
          fontWeight: 500, letterSpacing: '-0.01em',
          animation: 'slideUpSm 0.15s ease both',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p style={{
          color: 'var(--text-muted)', fontSize: 12, marginTop: 6,
          letterSpacing: '-0.01em',
        }}>
          {hint}
        </p>
      )}
    </div>
  )
}

export default Input
