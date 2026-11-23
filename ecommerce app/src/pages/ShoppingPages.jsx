import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { api, validateCheckoutURL } from '../services/api';
import { ActionButton, Empty, ErrorPanel, Field, Hero, Icon, Loading, money, StoreImage, useResource } from '../components/Ui';
import { ProductGrid } from '../components/ProductCard';
import AsyncForm from '../components/AsyncForm';
export function CartPage() {
  const { cart, cartCount, refreshCart, updateQuantity, removeFromCart, clearCart } = useStore();
  const resource = useResource(() => refreshCart(), [refreshCart]);
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  return <><Hero title="Shopping Cart" subtitle="Your favorites are almost yours" icon="cart"/><section className="content">{!cart?.products?.length ? <Empty title="Your cart is empty" text="Add something you love and come back here."/> : <div className="cart-layout"><div className="cart-list"><div className="section-heading"><h2>{cartCount} items in your cart</h2><ActionButton className="text-button" action={async () => { if (window.confirm('Remove every item from your cart?')) await clearCart(); }}>Clear cart</ActionButton></div>{cart.products.map(item => <article className="cart-row" key={item.product._id}><StoreImage src={item.product.imageCover} alt={item.product.title}/><div><Link to={`/products/${item.product._id}`}><h3>{item.product.title}</h3></Link><small>{item.product.category?.name}</small><strong>{money(item.price)}</strong><ActionButton className="text-button remove" action={() => removeFromCart(item.product._id)}><Icon name="trash"/> Remove</ActionButton></div><div className="quantity"><ActionButton action={() => updateQuantity(item.product._id, item.count - 1)} aria-label="Decrease quantity" disabled={item.count <= 1}><Icon name="minus"/></ActionButton><span>{item.count}</span><ActionButton action={() => updateQuantity(item.product._id, item.count + 1)} aria-label="Increase quantity"><Icon name="plus"/></ActionButton></div><strong>{money(item.price * item.count)}</strong></article>)}</div><aside className="summary"><h2>Order summary</h2><p><span>Subtotal</span><strong>{money(cart.totalCartPrice)}</strong></p><p><span>Shipping & tax</span><span>Calculated by the order service</span></p><div className="summary-total"><span>Subtotal</span><strong>{money(cart.totalCartPrice)}</strong></div><Link className="btn full-width" to="/checkout">Checkout <Icon name="arrow"/></Link><Link className="text-link" to="/products">Continue shopping</Link></aside></div>}</section></>;
}
export function WishlistPage() {
  const { wishlist, refreshWishlist } = useStore(); const resource = useResource(() => refreshWishlist(), [refreshWishlist]);
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  return <><Hero title="My Wishlist" subtitle="Keep your favorites close" icon="heart"/><section className="content">{wishlist.length ? <ProductGrid products={wishlist}/> : <Empty title="Your wishlist is waiting" text="Tap the heart on a product to save it here." icon="heart"/>}</section></>;
}
function ShippingFields({ defaults }) { return <><Field label="Street address & apartment" name="details" minLength={5} maxLength={300} autoComplete="street-address" defaultValue={defaults?.details}/><Field label="City" name="city" minLength={2} autoComplete="address-level2" defaultValue={defaults?.city}/><Field label="Phone number" name="phone" type="tel" autoComplete="tel" pattern="01[0125][0-9]{8}" title="Enter a valid Egyptian mobile number" defaultValue={defaults?.phone}/></>; }
export function CheckoutPage() {
  const { cart, refreshCart, shipping, setShipping } = useStore(); const navigate = useNavigate();
  const resource = useResource(() => refreshCart(), [refreshCart]);
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  if (!cart?.products?.length) return <Navigate to="/cart" replace/>;
  return <><Hero title="Checkout" subtitle="A few details, then you’re all set" icon="cart"/><section className="content checkout-layout"><AsyncForm className="panel" onSubmit={values => { setShipping(values); navigate('/review-order'); }} submitLabel="Review order"><h2>Shipping address</h2><ShippingFields defaults={shipping}/><h2 className="payment-heading">Payment method</h2><label className="payment-option"><input type="radio" name="payment" value="cash" defaultChecked={!shipping || shipping.payment === 'cash'}/><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span></label><label className="payment-option"><input type="radio" name="payment" value="online" defaultChecked={shipping?.payment === 'online'}/><span><strong>Online payment</strong><small>Continue to secure Stripe checkout</small></span></label></AsyncForm><aside className="summary"><h2>Your order</h2>{cart.products.map(x => <p key={x.product._id}><span>{x.product.title} × {x.count}</span><strong>{money(x.price * x.count)}</strong></p>)}<div className="summary-total"><span>Subtotal</span><strong>{money(cart.totalCartPrice)}</strong></div><p className="muted">The API determines final shipping, tax, and payment availability.</p></aside></section></>;
}
export function ReviewOrderPage() {
  const { shipping, setShipping, cart, refreshCart, setCart, authenticated, notify } = useStore(); const navigate = useNavigate();
  const resource = useResource(() => refreshCart(), [refreshCart]);
  if (!shipping) return <Navigate to="/checkout" replace/>;
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  if (!cart?.products?.length) return <Navigate to="/cart" replace/>;
  async function place() {
    const { payment, ...address } = shipping;
    if (payment === 'cash') { await authenticated(token => api.cashOrder(cart._id, address, token)); setCart(null); setShipping(null); notify('Your cash order was placed successfully.'); navigate('/orders', { replace: true }); }
    else { const result = await authenticated(token => api.checkout(cart._id, address, token)); if (!result.session?.url) throw Error('The service did not return a payment session.'); window.location.assign(validateCheckoutURL(result.session.url)); }
  }
  return <><Hero title="Review your order" subtitle="Check your details before placing your order" icon="check"/><section className="content narrow"><div className="panel"><h2>Deliver to</h2><p>{shipping.details}<br/>{shipping.city}<br/>{shipping.phone}</p><h2>Payment</h2><p>{shipping.payment === 'cash' ? 'Cash on delivery' : 'Secure online payment through Stripe'}</p><h2>Items</h2>{cart.products.map(x => <p className="review-line" key={x.product._id}><span>{x.product.title} × {x.count}</span><strong>{money(x.price * x.count)}</strong></p>)}<div className="summary-total"><span>Subtotal</span><strong>{money(cart.totalCartPrice)}</strong></div><p className="muted">The order service calculates the final order total, including any shipping and tax.</p><AsyncForm onSubmit={place} submitLabel={shipping.payment === 'cash' ? 'Place cash order' : 'Continue to secure payment'}/><Link to="/checkout" className="text-link">Edit shipping details</Link></div></section></>;
}
export function OrdersPage() {
  const { authenticated } = useStore();
  const resource = useResource(() => authenticated(async token => {
    const identity = await api.verifyToken(token); const id = identity.decoded?.id || identity.decoded?._id;
    if (!id) throw Error('Unable to identify your account. Please sign out and sign in again.');
    const result = await api.orders(id, token); return Array.isArray(result) ? result : result.data || [];
  }), [authenticated]);
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  return <><Hero title="My Orders" subtitle="Track the things you love"/><section className="content">{resource.data.length ? <div className="orders-list">{resource.data.map(order => <article className="panel order" key={order._id}><div className="section-heading"><div><h2>Order #{order.id || order._id}</h2><small>{new Date(order.createdAt).toLocaleDateString('en-GB')}</small></div><span className="status-chip">{order.isDelivered ? 'Delivered' : 'Processing'}</span></div><div className="order-meta"><span>{order.paymentMethodType} · {order.isPaid ? 'Paid' : 'Unpaid'}</span><strong>{money(order.totalOrderPrice)}</strong></div>{(order.cartItems || []).map(item => <Link className="order-item" key={item._id || item.product?._id} to={`/products/${item.product?._id}`}><StoreImage src={item.product?.imageCover} alt={item.product?.title || 'Ordered product'}/><span>{item.product?.title}<small>Quantity: {item.count} · {money(item.price)}</small></span></Link>)}<p className="muted">{order.shippingAddress?.details} · {order.shippingAddress?.city}</p></article>)}</div> : <Empty title="No orders yet" text="Your order history will appear here after your first order." icon="box"/>}</section></>;
}
