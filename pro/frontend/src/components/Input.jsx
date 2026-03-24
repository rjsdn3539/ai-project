function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          background: '#fff',
          color: '#111',
        }}
        {...props}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

export default Input
