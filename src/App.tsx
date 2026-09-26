import { Route, Routes } from "react-router-dom";
import { StoreProvider, useStore } from "./state/Store";
import { Footer, Header } from "./components/Layout";
import Home from "./pages/Home";
import Shop, { Wishlist, NotFound } from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart, { CartDrawer } from "./pages/Cart";
import Checkout from "./pages/Checkout";
import { About, Contact, Help } from "./pages/Info";
import { FlyToBag, RouteEffects } from "./components/MotionEffects";
import WebMCP from "./components/WebMCP";
import LoadingScreen from "./components/LoadingScreen";
function Storefront() {
  const { notice } = useStore();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <WebMCP />
      <RouteEffects />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:category" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help/:topic" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <FlyToBag />
      <div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice}
      </div>
    </>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <LoadingScreen />
      <Storefront />
    </StoreProvider>
  );
}
