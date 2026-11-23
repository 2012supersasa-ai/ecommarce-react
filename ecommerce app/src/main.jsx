import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import App from './App';
import './styles.css';
// The documented Stripe integration redirects to a pathname rather than a hash.
const paymentCallback = window.location.pathname.match(/\/(allorders|orders|cart)\/?$/);
if (paymentCallback) {
  const root = window.location.pathname.slice(0, paymentCallback.index + 1);
  window.history.replaceState(null, '', `${root}#/${paymentCallback[1] === 'cart' ? 'cart' : 'orders'}`);
}
createRoot(document.getElementById('root')).render(
  <StrictMode><HashRouter><StoreProvider><App/></StoreProvider></HashRouter></StrictMode>,
);
