function Button({ children, loading, variant = 'primary', fullWidth, size = 'md', style: styleProp, ...props }) {
  const sizes = {
    sm: { padding: '6px 14px',  fontSize: 13, borderRadius: 9  },
    md: { padding: '10px 20px', fontSize: 14, borderRadius: 10 },
    lg: { padding: '13px 28px', fontSize: 15, borderRadius: 12 },
  }

  const base = {
    ...sizes[size],
    fontWeight: 600,
    cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    width: fullWidth ? '100%' : undefined,
    opacity: loading || props.disabled ? 0.55 : 1,
    transition: 'background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease, opacity 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
    position: 'relative',
    userSelect: 'none',
  }

  const variants = {
    primary: {
      background: 'var(--primary)',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(124,106,240,0.3)',
    },
    danger: {
      background: 'var(--danger)',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary)',
      border: '1.5px solid var(--primary-border)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1.5px solid var(--border)',
      boxShadow: 'none',
    },
    subtle: {
      background: 'var(--primary-light)',
      color: 'var(--primary)',
      border: '1.5px solid var(--primary-border)',
      boxShadow: 'none',
    },
  }

  const hoverMap = {
    primary: { background: 'var(--primary-hover)', boxShadow: '0 4px 16px rgba(124,106,240,0.45)', transform: 'translateY(-1px)' },
    danger:  { background: '#b91c1c',              boxShadow: '0 4px 14px rgba(220,38,38,0.4)',   transform: 'translateY(-1px)' },
    outline: { background: 'var(--primary-light)',  transform: 'translateY(-1px)' },
    ghost:   { background: 'var(--bg)',             transform: 'translateY(-1px)' },
    subtle:  { background: 'var(--bg-indigo)',       transform: 'translateY(-1px)' },
  }

  const handleMouseEnter = (e) => {
    if (!loading && !props.disabled) {
      Object.assign(e.currentTarget.style, hoverMap[variant] || {})
    }
    props.onMouseEnter?.(e)
  }

  const handleMouseLeave = (e) => {
    const reset = { transform: 'translateY(0)', ...variants[variant] }
    Object.assign(e.currentTarget.style, reset)
    props.onMouseLeave?.(e)
  }

  const handleMouseDown = (e) => {
    if (!loading && !props.disabled) {
      e.currentTarget.style.transform = 'translateY(0) scale(0.97)'
      e.currentTarget.style.boxShadow = variants[variant]?.boxShadow || 'none'
    }
    props.onMouseDown?.(e)
  }

  const handleMouseUp = (e) => {
    if (!loading && !props.disabled) {
      Object.assign(e.currentTarget.style, hoverMap[variant] || {})
    }
    props.onMouseUp?.(e)
  }

  return (
    <button
      style={{ ...base, ...variants[variant], ...styleProp }}
      disabled={loading || props.disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {loading ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          처리 중...
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </>
      ) : children}
    </button>
  )
}

export default Button
