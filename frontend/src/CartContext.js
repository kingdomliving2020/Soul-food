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
  },
  // Gift Certificate Products
  gift_certificate_book: {
    id: 'gift_certificate_book',
    name: 'Book Selection Gift Certificate',
    description: 'Redeemable for any Soul Food series book',
    listPrice: 0, // Dynamic pricing
    salePrice: 0, // Set by amount selection
    currency: 'USD',
    isGiftCertificate: true
  }
};

export const CartProvider = ({ children }) => {
  // Initialize cart directly from localStorage to prevent race condition
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('soulFoodCart');
      console.log('[Cart] Initial load from localStorage:', savedCart ? 'found' : 'empty');
      
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validItems = parsed.filter(item => 
            item && (item.productId || item.id) && (item.salePrice !== undefined || item.price !== undefined)
          );
          console.log('[Cart] Initialized with', validItems.length, 'items');
          return validItems;
        }
      }
    } catch (e) {
      console.error('[Cart] Error loading cart on init:', e);
      localStorage.removeItem('soulFoodCart');
    }
    return [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true); // Already initialized in useState

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('[Cart] Saving to localStorage:', cartItems.length, 'items');
    localStorage.setItem('soulFoodCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Flexible addToCart - handles both PRODUCTS lookup and custom items
  const addToCart = (itemOrProductId, quantity = 1, metadata = {}) => {
    let itemToAdd;
    let uniqueKey;

    // Check if it's a custom item object (from QuickOrder merchandise)
    if (typeof itemOrProductId === 'object' && itemOrProductId !== null) {
      const customItem = itemOrProductId;
      uniqueKey = customItem.id || `custom_${Date.now()}`;
      itemToAdd = {
        productId: customItem.id,
        uniqueKey: uniqueKey,
        name: customItem.name,
        salePrice: customItem.price,
        listPrice: customItem.price,
        quantity: customItem.quantity || 1,
        image: customItem.image,
        metadata: {
          series: customItem.series || null,
          seriesName: customItem.seriesName || null,
          edition: customItem.edition || 'standard',
          medium: customItem.medium || 'physical',
          unit_price: customItem.price
        }
      };
    } else {
      // Standard product lookup
      const productId = itemOrProductId;
      const product = PRODUCTS[productId];
      
      if (!product) {
        console.error('Product not found:', productId);
        return;
      }

      uniqueKey = `${productId}_${metadata.series}_${metadata.edition}_${metadata.medium}`;
      itemToAdd = {
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
      };
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.uniqueKey === uniqueKey);
      
      if (existingItem) {
        // Update quantity if same configuration already in cart
        return prevItems.map(item =>
          item.uniqueKey === uniqueKey
            ? { ...item, quantity: item.quantity + (itemToAdd.quantity || 1) }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, itemToAdd];
      }
    });
    
    // Open cart sidebar when item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (keyToMatch) => {
    console.log('[Cart] removeFromCart called:', keyToMatch);
    setCartItems(prevItems => prevItems.filter(item => {
      const itemKey = item.uniqueKey || item.productId || item.id;
      return itemKey !== keyToMatch;
    }));
  };

  const updateQuantity = (keyToMatch, newQuantity) => {
    console.log('[Cart] updateQuantity called:', { keyToMatch, newQuantity });
    
    if (newQuantity <= 0) {
      removeFromCart(keyToMatch);
      return;
    }
    
    setCartItems(prevItems => {
      const updated = prevItems.map(item => {
        // Match by uniqueKey, productId, or id
        const itemKey = item.uniqueKey || item.productId || item.id;
        if (itemKey === keyToMatch) {
          console.log('[Cart] Found item to update:', item.name, 'new qty:', newQuantity);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      return updated;
    });
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

  // Special function to add gift certificates to cart
  const addGiftCertificateToCart = (giftCertData) => {
    const uniqueKey = `gift_certificate_${giftCertData.certificateType}_${Date.now()}`;
    
    const giftCertItem = {
      productId: `gift_certificate_${giftCertData.certificateType}`,
      uniqueKey: uniqueKey,
      name: `Gift Certificate - ${giftCertData.certificateTypeName}`,
      salePrice: giftCertData.amount,
      listPrice: giftCertData.amount,
      quantity: 1,
      isGiftCertificate: true,
      metadata: {
        certificateType: giftCertData.certificateType,
        certificateTypeName: giftCertData.certificateTypeName,
        recipientName: giftCertData.recipientName,
        recipientEmail: giftCertData.recipientEmail,
        senderName: giftCertData.senderName,
        senderEmail: giftCertData.senderEmail,
        message: giftCertData.message || '',
        amount: giftCertData.amount
      }
    };

    setCartItems(prevItems => [...prevItems, giftCertItem]);
    setIsCartOpen(true);
    
    return uniqueKey;
  };

  // Check if cart has gift certificates
  const hasGiftCertificates = () => {
    return cartItems.some(item => item.isGiftCertificate);
  };

  const value = {
    cartItems,
    addToCart,
    addGiftCertificateToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    hasGiftCertificates,
    isCartOpen,
    setIsCartOpen
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
