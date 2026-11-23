import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { asset, Field, PasswordField } from '../components/Ui';
import AsyncForm from '../components/AsyncForm';
const copy = {
  login: ['Welcome back', 'Sign in to your FreshCart account', 'Sign in'],
  register: ['Create your account', 'Your next favorite find is waiting', 'Create account'],
  forgot: ['Forgot your password?', 'We’ll send a verification code to your email', 'Send reset code'],
  verify: ['Check your inbox', 'Enter the reset code sent to your email', 'Verify code'],
  reset: ['Set a new password', 'Choose a strong password for your account', 'Reset password'],
  'change-password': ['Change password', 'Keep your account safe with a strong password', 'Update password'],
};
export default function AuthPage({ mode }) {
  const { saveSession, updateToken, authenticated, recovery, setRecovery, notify } = useStore();
  const navigate = useNavigate(); const location = useLocation();
  const [title, description, button] = copy[mode];
  if (mode === 'verify' && !recovery?.email) return <Navigate to="/forgot" replace/>;
  if (mode === 'reset' && !recovery?.verified) return <Navigate to="/forgot" replace/>;
  async function submit(values) {
    if (values.rePassword && values.password !== values.rePassword) throw Error('The passwords do not match.');
    if (mode === 'login' || mode === 'register') {
      const result = await (mode === 'login' ? api.signin(values) : api.signup(values));
      saveSession(result); notify(mode === 'login' ? 'Welcome back!' : 'Your account is ready.');
      const destination = location.state?.from;
      navigate(typeof destination === 'string' && destination.startsWith('/') && !destination.startsWith('//') ? destination : '/products', { replace: true });
    }
    if (mode === 'forgot') { await api.forgot(values); setRecovery({ email: values.email, verified: false }); notify('A reset code has been sent to your email.'); navigate('/verify'); }
    if (mode === 'verify') { await api.verifyCode(values); setRecovery(previous => ({ ...previous, verified: true })); navigate('/reset'); }
    if (mode === 'reset') { await api.resetPassword({ email: recovery.email, newPassword: values.password }); setRecovery(null); notify('Password reset. Sign in with your new password.'); navigate('/login', { replace: true }); }
    if (mode === 'change-password') { const result = await authenticated(token => api.changePassword(values, token)); if (result.token) updateToken(result.token); notify('Password updated.'); navigate('/account'); }
  }
  return <section className="auth-wrap"><div className="auth-card"><Link to="/home"><img src={asset('assets/logo.svg')} width="160" height="31" alt="FreshCart"/></Link><h1>{title}</h1><p>{description}</p><AsyncForm key={mode} onSubmit={submit} submitLabel={button}>
    {mode === 'register' && <Field label="Full name" name="name" autoComplete="name" minLength={3} maxLength={60}/>}
    {['login', 'register', 'forgot'].includes(mode) && <Field label="Email address" name="email" type="email" autoComplete="email"/>}
    {mode === 'change-password' && <PasswordField label="Current password" name="currentPassword" current minLength={6}/>}
    {['login', 'register', 'reset', 'change-password'].includes(mode) && <PasswordField label={mode === 'reset' || mode === 'change-password' ? 'New password' : 'Password'} current={mode === 'login'} minLength={mode === 'login' ? 6 : 8}/>}
    {['register', 'change-password'].includes(mode) && <PasswordField label="Confirm password" name="rePassword"/>}
    {mode === 'register' && <Field label="Phone number" name="phone" type="tel" autoComplete="tel" pattern="01[0125][0-9]{8}" title="Enter an 11-digit Egyptian mobile number, starting 010, 011, 012 or 015"/>}
    {mode === 'verify' && <Field label="Reset code" name="resetCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code"/>}
    {mode === 'login' && <Link to="/forgot" className="forgot-link">Forgot password?</Link>}
  </AsyncForm>{mode === 'login' ? <p className="auth-switch">New to FreshCart? <Link to="/register" state={location.state}>Create an account</Link></p> : mode === 'register' ? <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p> : <Link to={mode === 'change-password' ? '/account' : '/login'} className="text-link">{mode === 'change-password' ? 'Back to account' : 'Back to sign in'}</Link>}</div></section>;
}
