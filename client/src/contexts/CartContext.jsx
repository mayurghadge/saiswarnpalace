import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Demo product data - matching Products page
const demoProducts = {
  1: { id: 1, name: 'Elegant Gold Necklace', price: 21414, discount_price: 21414, image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"%3E%3Cdefs%3E%3ClinearGradient id=\"prod1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23FFD700;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23prod1)\" width=\"300\" height=\"300\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"48\" fill=\"white\"%3E📿%3C/text%3E%3C/svg%3E' },
  2: { id: 2, name: 'Diamond Gold Ring', price: 89000, discount_price: 89000, image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"%3E%3Cdefs%3E%3ClinearGradient id=\"prod2\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23E0E7FF;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23C7D2FE;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23prod2)\" width=\"300\" height=\"300\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"48\" fill=\"%239D7E2A\"%3E💍%3C/text%3E%3C/svg%3E' },
  3: { id: 3, name: 'Silver Earrings', price: 1586, discount_price: 1586, image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"%3E%3Cdefs%3E%3ClinearGradient id=\"prod3\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23C0C0C0;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23E8E8E8;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23prod3)\" width=\"300\" height=\"300\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"48\" fill=\"%23666\"%3E✨%3C/text%3E%3C/svg%3E' },
  4: { id: 4, name: 'Gold Bangles', price: 509973, discount_price: 509973, image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"%3E%3Cdefs%3E%3ClinearGradient id=\"prod4\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23c4a35a;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23prod4)\" width=\"300\" height=\"300\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"48\" fill=\"white\"%3E⚜️%3C/text%3E%3C/svg%3E' },
  5: { id: 5, name: 'Platinum Pendant', price: 45000, discount_price: 42000, image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"%3E%3Cdefs%3E%3ClinearGradient id=\"prod5\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23E5E4E2;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23BFC1C2;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23prod5)\" width=\"300\" height=\"300\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"48\" fill=\"%23444\"%3E💎%3C/text%3E%3C/svg%3E' },
  6: { id: 6, name: 'Gold Chain', price: 75000, discount_price: 70000, image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"%3E%3Cdefs%3E%3ClinearGradient id=\"prod6\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23D4AF37;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23prod6)\" width=\"300\" height=\"300\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"48\" fill=\"white\"%3E⛓️%3C/text%3E%3C/svg%3E' }
};

const buildCartItem = (product) => ({
  id: product.id,
  name: product.name,
  price: toNumber(product.estimated_price ?? product.discount_price ?? product.price, 0),
  discount_price: product.discount_price != null ? toNumber(product.discount_price, 0) : null,
  estimated_price: product.estimated_price != null ? toNumber(product.estimated_price, 0) : null,
  image: product.image || product.images || '',
  sku: product.sku || null,
  quantity: toNumber(product.quantity, 1),
  purity: product.purity || null,
  purity_label: product.purity_label || null,
  weight: toNumber(product.weight, 0),
  rate_per_gram: toNumber(product.rate_per_gram ?? product.rate, 0),
  item_code: product.item_code || null,
  huid_hallmark: product.huid_hallmark || null,
  material: product.material || null,
  category_name: product.category_name || null,
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);
  
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (productInput, quantity = 1) => {
    const product = typeof productInput === 'object' && productInput !== null
      ? buildCartItem({ ...productInput, quantity })
      : demoProducts[productInput]
        ? buildCartItem({ ...demoProducts[productInput], quantity })
        : null;

    if (!product) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const addToWishlist = (productInput) => {
    if (!productInput || typeof productInput !== 'object') return;

    const product = buildCartItem(productInput);
    setWishlist((currentWishlist) => (
      currentWishlist.some((item) => item.id === product.id)
        ? currentWishlist
        : [...currentWishlist, product]
    ));
  };

  const removeFromWishlist = (productId) => {
    setWishlist((currentWishlist) => currentWishlist.filter((item) => item.id !== productId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.discount_price || item.price) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, wishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
