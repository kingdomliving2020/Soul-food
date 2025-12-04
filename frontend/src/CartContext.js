import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Product definitions matching backend
export const PRODUCTS = {
  single_lesson: {
    id: 'single_lesson',
    name: 'Single Lesson',
    description: 'Download or online access to one lesson',
    listPrice: 4.99,
    salePrice: 1.99,
    currency: 'USD'
  },
  monthly_pack: {
    id: 'monthly_pack',
    name: 'Monthly Pack (4 Lessons)',
    description: 'Download or online access to 4 lessons',
    listPrice: 6.75,
    salePrice: 5.99,
    currency: 'USD'
  },
  mealtime_bundle: {
    id: 'mealtime_bundle',
    name: 'Mealtime Bundle (12 Lessons)',
    description: 'One of each edition per mealtime package',
    listPrice: 13.99,
    salePrice: 12.99,
    currency: 'USD'
  },
  combo_bundle: {
    id: 'combo_bundle',
    name: 'Combo Bundle (24 Lessons)',
    description: 'Multiple books of a single type',
    listPrice: 24.99,
    salePrice: 22.99,
    currency: 'USD'
  },
  instructor_set: {
    id: 'instructor_set',
    name: 'Instructor Set (36 Lessons)',
    description: 'Box set: Breakfast, Lunch, Dinner, Supper (Youth, Adult, Instructor)',
    listPrice: 44.99,
    salePrice: 39.99,
    currency: 'USD'
  },
  gaming_day_pass: {
    id: 'gaming_day_pass',
    name: 'Gaming Day Pass',
    description: '24-hour access to all game modes',
    listPrice: 40.00,
    salePrice: 29.99,
    currency: 'USD'
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('soulFoodCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('soulFoodCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (productId, quantity = 1, metadata = {}) => {
    const product = PRODUCTS[productId];
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    // Create unique key based on product + metadata for different configurations
    const uniqueKey = `${productId}_${metadata.series}_${metadata.edition}_${metadata.medium}`;

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.uniqueKey === uniqueKey);
      
      if (existingItem) {
        // Update quantity if same configuration already in cart
        return prevItems.map(item =>
          item.uniqueKey === uniqueKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart with full metadata
        return [...prevItems, { 
          productId,
          uniqueKey,
          ...product,
          quantity,
          metadata: {
            series: metadata.series || null,
            seriesName: metadata.seriesName || null,
            edition: metadata.edition || 'adult',
            medium: metadata.medium || 'pdf',
            unit_price: metadata.unit_price || product.salePrice
          }
        }];
      }
    });
    
    // Open cart sidebar when item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (uniqueKey) => {
    setCartItems(prevItems => prevItems.filter(item => item.uniqueKey !== uniqueKey));
  };

  const updateQuantity = (uniqueKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(uniqueKey);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.uniqueKey === uniqueKey
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.salePrice * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isCartOpen,
    setIsCartOpen
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
