import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { ActionButton, Empty, ErrorPanel, Hero, Icon, Loading, money, SnapshotNotice, Stars, StoreImage, useResource } from '../components/Ui';
import { ProductGrid } from '../components/ProductCard';
export function ProductListing({ products, title = 'All Products', subtitle = 'Explore our complete product collection', filtered = false, subcategories = [] }) {
  const { query, setQuery } = useStore(); const [page, setPage] = useState(1); const [sort, setSort] = useState('default');
  useEffect(() => { setPage(1); }, [query, sort, title]);
  const results = useMemo(() => {
    const visible = products.filter(p => [p.title, p.category?.name, p.brand?.name].join(' ').toLowerCase().includes(query.toLowerCase()));
    if (sort === 'price-up') visible.sort((a, b) => a.price - b.price);
    if (sort === 'price-down') visible.sort((a, b) => b.price - a.price);
    if (sort === 'rating') visible.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
    return visible;
  }, [products, query, sort]);
  const pages = Math.max(1, Math.ceil(results.length / 40)); const activePage = Math.min(page, pages);
  const visible = results.slice((activePage - 1) * 40, activePage * 40);
  return <><Hero title={title} subtitle={subtitle}/><section className="catalog"><SnapshotNotice/>{subcategories.length > 0 && <div className="subcategory-tags">{subcategories.map(s => <span key={s._id}>{s.name}</span>)}</div>}<div className="catalog-toolbar"><p>Showing {visible.length} products{query && ` for “${query}”`}</p>{filtered && <Link to="/products">All products <Icon name="arrow"/></Link>}</div>{visible.length ? <ProductGrid products={visible}/> : <div className="empty"><Icon name="search"/><h2>No products found</h2><p>Try another search or browse our full collection.</p><Link className="btn" to="/products" onClick={() => setQuery('')}>View all products</Link></div>}<div className="catalog-bottom"><label>Sort by <select value={sort} onChange={event => setSort(event.target.value)}><option value="default">Featured</option><option value="price-up">Price: low to high</option><option value="price-down">Price: high to low</option><option value="rating">Highest rated</option></select></label><div className="pagination" aria-label="Product pages">{Array.from({ length: pages }, (_, i) => <button key={i} onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={activePage === i + 1 ? 'current' : ''} aria-label={`Page ${i + 1}`} aria-current={activePage === i + 1 ? 'page' : undefined}>{i + 1}</button>)}</div></div></section></>;
}
export function ProductsPage() { const { products, catalogLoading, catalogError } = useStore(); if (catalogLoading) return <Loading/>; if (!products.length && catalogError) return <ErrorPanel error={catalogError} retry={() => window.location.reload()}/>; return <ProductListing products={products}/>; }
export function HomePage() {
  const { products, categories, catalogLoading } = useStore(); if (catalogLoading) return <Loading/>;
  return <><section className="home-hero"><div><span className="eyebrow">EVERYDAY FINDS. EXCEPTIONAL VALUE.</span><h1>A little style.<br/>A lot to love.</h1><p>Discover your next favorite, from fresh fashion<br/>to the essentials that make life easier.</p><Link className="btn" to="/products">Explore the collection <Icon name="arrow"/></Link></div>{products[0] && <Link className="home-feature" to={`/products/${products[0]._id}`}><StoreImage src={products[0].imageCover} alt="Colorful women’s shawl" loading="eager"/><span>New season. New favorites.</span></Link>}</section><section className="content"><SnapshotNotice/><div className="section-heading"><h2>Shop by category</h2><Link to="/categories">See all <Icon name="arrow"/></Link></div><div className="category-strip">{categories.slice(0, 6).map(c => <Link key={c._id} to={`/categories/${c._id}`}><StoreImage src={c.image} alt={c.name}/><strong>{c.name}</strong></Link>)}</div><div className="section-heading"><h2>Fresh finds for you</h2><Link to="/products">Shop all <Icon name="arrow"/></Link></div><ProductGrid products={products.slice(0, 10)}/></section></>;
}
export function CollectionsPage({ type }) {
  const store = useStore(); const categories = type === 'categories'; if (store.catalogLoading) return <Loading/>;
  return <><Hero title={categories ? 'Categories' : 'Brands'} subtitle={categories ? 'Find something you love in every aisle' : 'Explore the brands you know and love'}/><section className="content"><SnapshotNotice/><div className={`collection-grid ${categories ? '' : 'brand-grid'}`}>{store[type].map(c => <Link className="collection-card" to={`/${type}/${c._id}`} key={c._id}><StoreImage src={c.image} alt={c.name}/><h2>{c.name}</h2><span>Explore collection <Icon name="arrow"/></span></Link>)}</div></section></>;
}
export function CollectionDetailPage({ type }) {
  const { id } = useParams();
  const resource = useResource(async signal => {
    const [entity, products, subcategories] = await Promise.all([
      type === 'brands' ? api.brand(id, signal) : api.category(id, signal),
      api.products(`?limit=50&${type === 'brands' ? 'brand' : 'category[in]'}=${encodeURIComponent(id)}`, signal),
      type === 'categories' ? api.subcategories(id, signal) : Promise.resolve({ data: [] }),
    ]);
    return { entity: entity.data, products: products.data, subcategories: subcategories.data };
  }, [id, type]);
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  const { entity, products, subcategories } = resource.data;
  return <ProductListing key={`${type}-${id}`} products={products} title={entity.name} subtitle={`Explore the ${entity.name} collection`} subcategories={subcategories} filtered/>;
}
export function ProductDetailsPage() {
  const { id } = useParams(); const { products, addToCart, wishIds, toggleWishlist } = useStore();
  const [selected, setSelected] = useState(null);
  useEffect(() => { setSelected(null); }, [id]);
  const resource = useResource(async signal => (await api.product(id, signal)).data, [id]);
  if (resource.loading) return <Loading/>; if (resource.error) return <ErrorPanel error={resource.error} retry={resource.retry}/>;
  const p = resource.data; const images = [...new Set([p.imageCover, ...(p.images || [])])];
  const related = products.filter(x => x.category?._id === p.category?._id && x._id !== p._id).slice(0, 5);
  return <><Hero title={p.title} subtitle={p.category?.name || 'Product details'}/><section className="content"><div className="product-detail"><div className="gallery"><StoreImage src={selected || p.imageCover} alt={p.title} className="detail-main-image" loading="eager"/><div className="thumbnails">{images.map((url, i) => <button key={url} className={(selected || p.imageCover) === url ? 'active' : ''} onClick={() => setSelected(url)} aria-label={`View photo ${i + 1}`}><StoreImage src={url} alt={p.title}/></button>)}</div></div><div className="detail-copy"><Link className="eyebrow" to={`/categories/${p.category?._id}`}>{p.category?.name}</Link><h2>{p.title}</h2><div className="rating"><Stars value={p.ratingsAverage}/><span>{p.ratingsAverage} · {p.ratingsQuantity} ratings</span></div><p className="description">{p.description}</p><Link className="text-link" to={`/brands/${p.brand?._id}`}>{p.brand?.name}</Link><div className="detail-price">{money(p.price)}</div><p className="stock">{p.quantity > 0 ? `${p.quantity} in stock` : 'Currently out of stock'}</p><div className="detail-buttons"><ActionButton className="btn" action={() => addToCart(p._id)} requireAuth disabled={p.quantity < 1}><Icon name="plus"/> Add to cart</ActionButton><ActionButton className="btn btn-light" requireAuth action={() => toggleWishlist(p)}><Icon name="heart"/>{wishIds.has(p._id) ? 'Remove from wishlist' : 'Save to wishlist'}</ActionButton></div><div className="delivery-note"><Icon name="truck"/> Free shipping on orders over 500 EGP</div></div></div><div className="section-heading"><h2>You may also like</h2><Link to="/products">View all</Link></div><ProductGrid products={related}/></section></>;
}
export function ComparePage() { const { compare, toggleCompare, addToCart } = useStore(); return <><Hero title="Compare products" subtitle="A closer look at your favorites"/><section className="content">{compare.length ? <div className="comparison">{compare.map(p => <div className="panel" key={p._id}><StoreImage src={p.imageCover} alt={p.title}/><h2>{p.title}</h2><p>{money(p.price)}</p><p>{p.brand?.name}</p><p>Rating: {p.ratingsAverage} / 5</p><p className="description">{p.description}</p><ActionButton className="btn" requireAuth action={() => addToCart(p._id)}>Add to cart</ActionButton><button className="text-button" onClick={() => toggleCompare(p)}>Remove</button></div>)}</div> : <Empty title="Nothing to compare" text="Choose the compare icon on up to three products." icon="compare"/>}</section></>; }
