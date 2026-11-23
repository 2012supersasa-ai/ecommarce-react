import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
export const money = value => `${Number(value || 0).toLocaleString('en-EG', { maximumFractionDigits: 2 })} EGP`;
export const asset = path => `${import.meta.env.BASE_URL}${path}`;
const paths = {
  search: <><circle cx="10.8" cy="10.8" r="6.2"/><path d="m16 16 4 4"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  cart: <><path d="M2 3h3l2.5 12h12L22 6H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
  user: <><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></>,
  box: <><path d="m3 7 9-5 9 5v10l-9 5-9-5Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  compare: <><path d="M20 3v6h-6M4 21v-6h6"/><path d="M20 9A8 8 0 0 0 6 5M4 15a8 8 0 0 0 14 4"/></>,
  headset: <path d="M4 14v-3a8 8 0 0 1 16 0v3M4 11H2v7h5v-7ZM20 11h2v7h-5v-7ZM20 18v3h-7"/>,
  plus: <path d="M12 5v14M5 12h14"/>, minus: <path d="M5 12h14"/>,
  chevron: <path d="m6 9 6 6 6-6"/>, arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>,
  check: <path d="m5 12 4 4L20 5"/>, menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
  truck: <><path d="M1 3h13v14H1ZM14 8h5l4 5v4h-9"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/></>,
};
export function Icon({ name, className = '' }) { return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.box}</svg>; }
export function StoreImage({ src, alt, className = '', loading = 'lazy', ...props }) {
  const local = asset(`assets/images/${String(src || '').split('/').pop()}`);
  const [failed, setFailed] = useState(false);
  const [remote, setRemote] = useState(false);
  useEffect(() => { setRemote(false); setFailed(false); }, [src]);
  const safeRemote = typeof src === 'string' && src.startsWith('https://');
  if (failed) return <span role="img" aria-label={`${alt}: image unavailable`} className={`image-fallback ${className}`}><Icon name="box"/><small>Image unavailable</small></span>;
  return <img {...props} src={remote && safeRemote ? src : local} alt={alt} className={className} loading={loading} decoding="async" onError={() => { if (!remote && safeRemote) setRemote(true); else setFailed(true); }}/>;
}
export function Hero({ title, subtitle, icon = 'box' }) { return <section className="page-hero"><div className="breadcrumb"><Link to="/home">Home</Link><span>/</span><span>{title}</span></div><div className="hero-content"><span className="hero-icon"><Icon name={icon}/></span><div><h1>{title}</h1><p>{subtitle}</p></div></div></section>; }
export function Stars({ value }) { return <span className="stars" aria-label={`${value} out of 5 stars`}><span>☆☆☆☆☆</span><span className="star-fill" style={{ width: `${Math.min(100, Math.max(0, Number(value) * 20))}%` }}>★★★★★</span></span>; }
export function Loading() { return <div className="loading" role="status"><span className="spinner"/>Loading…</div>; }
export function Empty({ title, text, icon = 'cart' }) { return <div className="empty"><Icon name={icon}/><h2>{title}</h2><p>{text}</p><Link className="btn" to="/products">Explore products <Icon name="arrow"/></Link></div>; }
export function ErrorPanel({ error, retry }) { return <div className="empty"><h2>We couldn’t load this page</h2><p role="alert">{error?.message || error}</p>{retry && <button className="btn" onClick={retry}>Try again</button>}<Link className="text-link" to="/products">Back to products</Link></div>; }
export function SnapshotNotice() { const { offline } = useStore(); return offline && <p className="notice">Showing the included catalog snapshot. Live stock and prices could not be refreshed. Checkout requires a connection.</p>; }
export function Field({ label, name, type = 'text', ...props }) { return <label className="field">{label}<input name={name} type={type} required {...props}/></label>; }
export function PasswordField({ label, name = 'password', current = false, minLength = 8 }) {
  const [show, setShow] = useState(false);
  return <label className="field">{label}<span className="password-input"><input name={name} type={show ? 'text' : 'password'} required minLength={minLength} maxLength={128} autoComplete={current ? 'current-password' : 'new-password'}/><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name="eye"/></button></span></label>;
}
/** Async buttons own their pending state; no document-wide click listeners. */
export function ActionButton({ action, children, requireAuth = false, className = '', disabled = false, ...props }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { token, notify } = useStore();
  const navigate = useNavigate(); const location = useLocation();
  async function click() {
    if (lock.current) return;
    if (requireAuth && !token) { notify('Sign in to continue.'); navigate('/login', { state: { from: location.pathname } }); return; }
    lock.current = true; setBusy(true);
    try { await action(); } catch (error) { notify(error.message); } finally { lock.current = false; setBusy(false); }
  }
  return <button type="button" {...props} className={`${className} ${busy ? 'busy' : ''}`} disabled={disabled || busy} aria-busy={busy} onClick={click}>{children}</button>;
}
/** Abort stale reads on route changes; mutations run only in event handlers. */
export function useResource(loader, dependencies) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    Promise.resolve().then(() => loader(controller.signal)).then(data => { if (active) setState({ data, loading: false, error: null }); }).catch(error => { if (active) setState({ data: null, loading: false, error }); });
    return () => { active = false; controller.abort(); };
    // Callers list the explicit inputs that determine the resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, version]);
  return { ...state, retry: () => setVersion(previous => previous + 1) };
}
