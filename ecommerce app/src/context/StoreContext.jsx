import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

const StoreContext = createContext(null);
const readSession = () => { try { return JSON.parse(sessionStorage.getItem('freshcart-react-session') || 'null'); } catch { return null; } };
export function StoreProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const token = session?.token;
  const user = session?.user;
  const [catalog, setCatalog] = useState({ products: [], categories: [], brands: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [offline, setOffline] = useState(false);
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [compare, setCompare] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [shipping, setShipping] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const sessionRef = useRef(token);
  sessionRef.current = token;
  const notify = useCallback(text => setMessage(text), []);
  const logout = useCallback(() => {
    sessionRef.current = undefined;
    setSession(null); setCart(null); setWishlist([]); setShipping(null);
    sessionStorage.removeItem('freshcart-react-session');
  }, []);
  const saveSession = useCallback(result => {
    const next = { token: result.token, user: result.user };
    if (!next.token) throw Error('The service did not return a session. Please sign in.');
    sessionStorage.setItem('freshcart-react-session', JSON.stringify(next));
    sessionRef.current = next.token; setSession(next);
  }, []);
  const updateUser = useCallback(nextUser => {
    setSession(previous => {
      const next = { ...previous, user: { ...previous.user, ...nextUser } };
      sessionStorage.setItem('freshcart-react-session', JSON.stringify(next));
      return next;
    });
  }, []);
  const updateToken = useCallback(nextToken => {
    sessionRef.current = nextToken;
    setSession(previous => {
      const next = { ...previous, token: nextToken };
      sessionStorage.setItem('freshcart-react-session', JSON.stringify(next));
      return next;
    });
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    const controller = new AbortController();
    const keys = ['products', 'categories', 'brands'];
    async function load() {
      try {
        const cached = await Promise.all(keys.map(async name => {
          const r = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, { signal: controller.signal });
          if (!r.ok) throw Error('Missing catalog snapshot.');
          return (await r.json()).data;
        }));
        if (!controller.signal.aborted) {
          setCatalog(Object.fromEntries(keys.map((key, i) => [key, cached[i]])));
          setCatalogLoading(false);
        }
      } catch { /* Live API can still recover a missing snapshot. */ }
      const results = await Promise.allSettled([
        api.products('?limit=50', controller.signal),
        api.categories(controller.signal), api.brands(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setCatalog(previous => ({ ...previous, ...Object.fromEntries(keys.flatMap((key, i) =>
        results[i].status === 'fulfilled' ? [[key, results[i].value.data]] : [])) }));
      setOffline(results.some(result => result.status === 'rejected'));
      if (results.every(result => result.status === 'rejected')) setCatalogError('The store could not refresh its catalog. Check your connection and reload.');
      setCatalogLoading(false);
    }
    load();
    return () => controller.abort();
  }, []);
  const authenticated = useCallback(async operation => {
    const current = token;
    if (!current) throw Error('Sign in to continue.');
    try {
      const result = await operation(current);
      if (sessionRef.current !== current) throw Error('Your session changed. Please try again.');
      return result;
    } catch (error) {
      if (error.status === 401 && sessionRef.current === current) { logout(); notify('Your session expired. Please sign in again.'); }
      throw error;
    }
  }, [token, logout, notify]);
  const refreshCart = useCallback(async () => {
    return authenticated(async current => {
      let result;
      try { result = (await api.cart(current)).data; }
      catch (error) { if (error.status === 404 && /cart/i.test(error.message)) result = null; else throw error; }
      if (sessionRef.current === current) setCart(result);
      return result;
    });
  }, [authenticated]);
  const refreshWishlist = useCallback(async () => authenticated(async current => {
    const result = (await api.wishlist(current)).data;
    if (sessionRef.current === current) setWishlist(result);
    return result;
  }), [authenticated]);
  useEffect(() => {
    if (!token) return;
    // Account badges can refresh independently; page-level fetches display their own errors.
    Promise.allSettled([refreshCart(), refreshWishlist()]);
  }, [token, refreshCart, refreshWishlist]);
  const addToCart = useCallback(async id => {
    const result = await authenticated(current => api.addCart(id, current));
    setCart(result.data); notify('Added to your cart.');
  }, [authenticated, notify]);
  const updateQuantity = useCallback(async (id, count) => {
    const result = await authenticated(current => api.updateCart(id, count, current)); setCart(result.data);
  }, [authenticated]);
  const removeFromCart = useCallback(async id => {
    const result = await authenticated(current => api.removeCart(id, current)); setCart(result.data); notify('Item removed.');
  }, [authenticated, notify]);
  const clearCart = useCallback(async () => {
    await authenticated(current => api.clearCart(current)); setCart(null); notify('Cart cleared.');
  }, [authenticated, notify]);
  const wishIds = useMemo(() => new Set(wishlist.map(product => product._id)), [wishlist]);
  const toggleWishlist = useCallback(async product => {
    const removing = wishIds.has(product._id);
    await authenticated(current => removing ? api.removeWishlist(product._id, current) : api.addWishlist(product._id, current));
    setWishlist(previous => removing ? previous.filter(p => p._id !== product._id) : [...previous.filter(p => p._id !== product._id), product]);
    notify(removing ? 'Removed from wishlist.' : 'Saved to your wishlist.');
  }, [wishIds, authenticated, notify]);
  const toggleCompare = useCallback(product => {
    setCompare(previous => {
      if (previous.some(p => p._id === product._id)) return previous.filter(p => p._id !== product._id);
      return previous.length < 3 ? [...previous, product] : previous;
    });
  }, []);
  const value = {
    ...catalog, catalogLoading, catalogError, offline, query, setQuery, token, user,
    saveSession, logout, updateUser, updateToken, authenticated, cart, setCart,
    refreshCart, addToCart, updateQuantity, removeFromCart, clearCart,
    wishlist, wishIds, refreshWishlist, toggleWishlist, compare, toggleCompare,
    shipping, setShipping, recovery, setRecovery, notify,
    cartCount: (cart?.products || []).reduce((sum, item) => sum + item.count, 0),
  };
  return <StoreContext.Provider value={value}>{children}<div id="notifications" aria-live="polite" aria-atomic="true">{message && <div className="toast" key={message}>{message}</div>}</div></StoreContext.Provider>;
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw Error('useStore must be used inside StoreProvider');
  return store;
}
