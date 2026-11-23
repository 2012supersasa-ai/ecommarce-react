import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { asset, Icon } from './Ui';
export function RequireAuth() {
  const { token } = useStore(); const location = useLocation();
  return token ? <Outlet/> : <Navigate to="/login" state={{ from: location.pathname }} replace/>;
}
export function Header() {
  const { token, user, query, setQuery, wishIds, cartCount } = useStore();
  const [search, setSearch] = useState(query); const [open, setOpen] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => { setSearch(query); }, [query]);
  function submit(event) { event.preventDefault(); setQuery(search.trim()); navigate('/products'); }
  return <header className="header"><Link to="/home" className="logo" aria-label="FreshCart home"><img src={asset('assets/logo.svg')} alt="FreshCart" width="160" height="31"/></Link><form className="search" role="search" onSubmit={submit}><input name="search" aria-label="Search products" placeholder="Search for products, brands and more..." value={search} onChange={event => setSearch(event.target.value)}/><button aria-label="Search"><Icon name="search"/></button></form><button className="mobile-menu icon-btn" onClick={() => setOpen(value => !value)} aria-label="Open navigation" aria-expanded={open}><Icon name="menu"/></button><nav className={`nav ${open ? 'open' : ''}`} aria-label="Main navigation"><Link to="/home">Home</Link><Link to="/products">Shop</Link><Link to="/categories">Categories <Icon name="chevron"/></Link><Link to="/brands">Brands</Link></nav><Link className="help" to="/support"><span><Icon name="headset"/></span><small>Support<strong>24/7 Help</strong></small></Link><Link className="header-action" to="/wishlist" aria-label="Wishlist"><Icon name="heart"/>{wishIds.size > 0 && <b className="badge">{wishIds.size}</b>}</Link><Link className="header-action" to="/cart" aria-label="Shopping cart"><Icon name="cart"/>{cartCount > 0 && <b className="badge">{cartCount}</b>}</Link><Link to={token ? '/account' : '/login'} className="btn signin"><Icon name="user"/><span>{token ? user?.name?.split(' ')[0] || 'Account' : 'Sign In'}</span></Link></header>;
}
function Footer() {
  const benefits = [['truck','Free Shipping','On orders over 500 EGP'],['compare','Easy Returns','14-day return policy'],['check','Secure Payment','100% secure checkout'],['headset','24/7 Support','We’re here to help']];
  return <footer><div className="benefits">{benefits.map(([name, title, text]) => <div key={name}><Icon name={name}/><span><strong>{title}</strong><small>{text}</small></span></div>)}</div><div className="footer-content"><div><img src={asset('assets/logo.svg')} width="160" height="31" alt="FreshCart"/><p>Your everyday favorites, all in one place.<br/>Fashion, electronics, and more.</p></div><div><strong>Shop</strong><Link to="/products">All products</Link><Link to="/categories">Categories</Link><Link to="/brands">Brands</Link></div><div><strong>Your account</strong><Link to="/account">My account</Link><Link to="/orders">Order history</Link><Link to="/wishlist">Wishlist</Link></div><div><strong>Need a hand?</strong><Link to="/support">Help & support</Link><Link to="/cart">Shopping cart</Link></div></div><div className="copyright">© {new Date().getFullYear()} FreshCart. All rights reserved.<span>VISA &nbsp; Mastercard &nbsp; Secure payments</span></div></footer>;
}
export default function Layout() {
  const location = useLocation(); const { compare } = useStore();
  useEffect(() => { window.scrollTo(0, 0); const name = location.pathname.split('/')[1] || 'products'; document.title = `${({products:'All Products',home:'Home',login:'Sign In',register:'Create Account',cart:'Shopping Cart',wishlist:'My Wishlist',orders:'My Orders',brands:'Brands',categories:'Categories',account:'My Account',checkout:'Checkout'})[name] || 'FreshCart'} | FreshCart`; }, [location.pathname]);
  return <><a className="skip-link" href="#main" onClick={event => { event.preventDefault(); const main = document.getElementById('main'); main?.focus(); main?.scrollIntoView(); }}>Skip to content</a><Header/><main id="main" tabIndex={-1}><Outlet/></main><Footer/>{compare.length > 0 && location.pathname !== '/compare' && <Link className="compare-tray btn" to="/compare">Compare products ({compare.length}) →</Link>}</>;
}
