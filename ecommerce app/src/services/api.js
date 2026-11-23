/** Route Academy public teaching API. No private API key is required. */
export const API_BASE = 'https://ecommerce.routemisr.com/api/v1';
export class ApiError extends Error {
 constructor(message, status, details) { super(message); this.name='ApiError'; this.status=status; this.details=details; }
}
export async function request(path, {method='GET', body, token, signal}={}) {
 const timeout = AbortSignal.timeout(25000);
 const combined = signal && AbortSignal.any ? AbortSignal.any([signal,timeout]) : signal || timeout;
 let response;
 try {
  response = await fetch(API_BASE+path, {method, headers:{Accept:'application/json', ...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {token} : {})}, body: body ? JSON.stringify(body) : undefined, signal:combined});
 } catch(error) {
  if (signal?.aborted) throw error;
  throw new ApiError('Unable to reach the store. Check your connection and try again.',0);
 }
 const data = await response.json().catch(()=>({}));
 if (!response.ok) throw new ApiError(data.message || data.errors?.[0]?.msg || 'Something went wrong. Please try again.',response.status,data);
 return data;
}
// The service caps page size at 50, even when a larger limit is requested.
export async function getAll(path, signal) {
 const first = await request(path, {signal});
 const pages = first.metadata?.numberOfPages || 1;
 if (pages < 2) return first;
 const rest = await Promise.all(Array.from({length: pages - 1}, (_, i) =>
  request(path + (path.includes('?') ? '&' : '?') + 'page=' + (i + 2), {signal})));
 return {...first, data: [...first.data, ...rest.flatMap(page => page.data)]};
}
export const api = {
 products: (query='',signal)=>getAll('/products'+query,signal),
 product: (id,signal)=>request('/products/'+encodeURIComponent(id),{signal}),
 categories: (signal)=>getAll('/categories?limit=50',signal),
 category: (id,signal)=>request('/categories/'+encodeURIComponent(id),{signal}),
 subcategories: (id,signal)=>request('/categories/'+encodeURIComponent(id)+'/subcategories',{signal}),
 brands: (signal)=>getAll('/brands?limit=50',signal),
 brand: (id,signal)=>request('/brands/'+encodeURIComponent(id),{signal}),
 signin: body=>request('/auth/signin',{method:'POST',body}),
 signup: body=>request('/auth/signup',{method:'POST',body}),
 forgot: body=>request('/auth/forgotPasswords',{method:'POST',body}),
 verifyCode: body=>request('/auth/verifyResetCode',{method:'POST',body}),
 resetPassword: body=>request('/auth/resetPassword',{method:'PUT',body}),
 verifyToken: token=>request('/auth/verifyToken',{token}),
 changePassword: (body,token)=>request('/users/changeMyPassword',{method:'PUT',body,token}),
 updateProfile: (body,token)=>request('/users/updateMe/',{method:'PUT',body,token}),
 cart: token=>request('/cart',{token}),
 addCart: (productId,token)=>request('/cart',{method:'POST',body:{productId},token}),
 updateCart: (id,count,token)=>request('/cart/'+encodeURIComponent(id),{method:'PUT',body:{count},token}),
 removeCart: (id,token)=>request('/cart/'+encodeURIComponent(id),{method:'DELETE',token}),
 clearCart: token=>request('/cart',{method:'DELETE',token}),
 wishlist: token=>request('/wishlist',{token}),
 addWishlist: (productId,token)=>request('/wishlist',{method:'POST',body:{productId},token}),
 removeWishlist: (id,token)=>request('/wishlist/'+encodeURIComponent(id),{method:'DELETE',token}),
 cashOrder: (id,shippingAddress,token)=>request('/orders/'+encodeURIComponent(id),{method:'POST',body:{shippingAddress},token}),
 checkout: (id,shippingAddress,token)=>request('/orders/checkout-session/'+encodeURIComponent(id)+'?url='+encodeURIComponent(new URL('.', location.href).href.replace(/\/$/, '')),{method:'POST',body:{shippingAddress},token}),
 orders: (id,token)=>request('/orders/user/'+encodeURIComponent(id),{token}),
 addresses: token=>request('/addresses',{token}),
 addAddress: (body,token)=>request('/addresses',{method:'POST',body,token}),
 removeAddress: (id,token)=>request('/addresses/'+encodeURIComponent(id),{method:'DELETE',token})
};
export function validateCheckoutURL(url) { const u=new URL(url); if(u.protocol!=='https:' || u.hostname!=='checkout.stripe.com') throw new Error('The payment service returned an unexpected checkout address.'); return u.href; }
