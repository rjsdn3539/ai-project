function Button({ children, loading, variant = 'primary', fullWidth, ...props }) {
  const base = {
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: loading ? 'not-allowed' : 'pointer',
    border: 'none',
    width: fullWidth ? '100%' : undefined,
    opacity: loading ? 0.7 : 1,
    transition: 'background 0.2s',
  }
  const variants = {
    primary: { background: '#4f46e5', color: '#fff' },
    danger: { background: '#ef4444', color: '#fff' },
    outline: { background: 'transparent', color: '#4f46e5', border: '1.5px solid #4f46e5' },
    ghost: { background: 'transparent', color: '#6b7280' },
  }
  return (
    <button style={{ ...base, ...variants[variant] }} disabled={loading} {...props}>
      {loading ? '처리 중...' : children}
    </button>
  )
}

export default Button
