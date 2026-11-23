import { useRef, useState } from 'react';
import { Icon } from './Ui';
export default function AsyncForm({ onSubmit, children, submitLabel, className = '', submitIcon = 'arrow', ...props }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function submit(event) {
    event.preventDefault(); if (lock.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    lock.current = true; setBusy(true); setError('');
    try { await onSubmit(values); } catch (cause) { setError(cause.message || 'Please try again.'); } finally { lock.current = false; setBusy(false); }
  }
  return <form {...props} className={className} onSubmit={submit}>{children}<div className="form-error" role="alert">{error}</div><button type="submit" className={`btn full-width ${busy ? 'busy' : ''}`} disabled={busy} aria-busy={busy}>{busy ? 'Please wait…' : submitLabel}{submitIcon && <Icon name={submitIcon}/>}</button></form>;
}
