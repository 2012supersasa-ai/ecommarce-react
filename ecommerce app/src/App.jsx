import { Navigate, Route, Routes } from 'react-router-dom';
import Layout, { RequireAuth } from './components/Layout';
import { Empty } from './components/Ui';
import { HomePage, ProductsPage, ProductDetailsPage, CollectionsPage, CollectionDetailPage, ComparePage } from './pages/CatalogPages';
import AuthPage from './pages/AuthPage';
import AccountPage from './pages/AccountPage';
import SupportPage from './pages/SupportPage';
import { CartPage, WishlistPage, CheckoutPage, ReviewOrderPage, OrdersPage } from './pages/ShoppingPages';
export default function App() {
  return <Routes><Route element={<Layout/>}>
    <Route index element={<Navigate to="/products" replace/>}/>
    <Route path="home" element={<HomePage/>}/>
    <Route path="products" element={<ProductsPage/>}/>
    <Route path="products/:id" element={<ProductDetailsPage/>}/>
    <Route path="categories" element={<CollectionsPage type="categories"/>}/>
    <Route path="categories/:id" element={<CollectionDetailPage type="categories"/>}/>
    <Route path="brands" element={<CollectionsPage type="brands"/>}/>
    <Route path="brands/:id" element={<CollectionDetailPage type="brands"/>}/>
    <Route path="compare" element={<ComparePage/>}/>
    <Route path="support" element={<SupportPage/>}/>
    {['login', 'register', 'forgot', 'verify', 'reset'].map(mode => <Route key={mode} path={mode} element={<AuthPage mode={mode}/>}/>)}
    <Route element={<RequireAuth/>}>
      <Route path="account" element={<AccountPage/>}/>
      <Route path="change-password" element={<AuthPage mode="change-password"/>}/>
      <Route path="cart" element={<CartPage/>}/>
      <Route path="wishlist" element={<WishlistPage/>}/>
      <Route path="checkout" element={<CheckoutPage/>}/>
      <Route path="review-order" element={<ReviewOrderPage/>}/>
      <Route path="orders" element={<OrdersPage/>}/>
      <Route path="allorders" element={<Navigate to="/orders" replace/>}/>
    </Route>
    <Route path="*" element={<Empty title="Page not found" text="Let’s get you back to the collection." icon="search"/>}/>
  </Route></Routes>;
}
