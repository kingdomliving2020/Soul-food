import React, { useState, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartContext } from './CartContext';
import { toast } from "sonner";

const QuickOrder = () => {
  const { addToCart } = useContext(CartContext);
  
  // Product catalog
  const products = [
    {
      id: 'breakfast',
      name: 'Break*fast Series',
      subtitle: 'Foundation in Christ',
      available: true,
      frontCover: '/covers/breakfast-adult-front.jpg',
      backCover: '/covers/breakfast-adult-back.jpg',
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription', 'ebook', 'physical'],
      prices: {
        adult: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        youth: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        instructor: { subscription: 14.99, ebook: 68.99, physical: 79.99 }
      }
    },
    {
      id: 'holiday',
      name: 'Holiday Series',
      subtitle: '4 C\'s of Christianity',
      available: true,
      frontCover: '/covers/holiday-adult-front.jpg',
      backCover: '/covers/holiday-adult-back.jpg',
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription', 'ebook', 'physical'],
      prices: {
        adult: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        youth: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        instructor: { subscription: 14.99, ebook: 68.99, physical: 79.99 }
      }
    },
    {
      id: 'holiday-box-set',
      name: 'Holiday Box Set',
      subtitle: 'Holiday + Break*fast Series Bundle',
      available: true,
      frontCover: '/covers/holiday-adult-front.jpg',
      badge: 'FREE Bookmark',
      editions: ['adult-youth-bundle'],
      formats: ['physical'],
      prices: {
        'adult-youth-bundle': { physical: 39.99 }
      }
    },
    {
      id: 'lunch',
      name: 'Lunch Series',
      subtitle: 'Kingdom Relationships',
      available: false,
      comingSoon: 'Q1 2026',
      frontCover: '/covers/holiday-adult-front.jpg', // Placeholder
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription', 'ebook', 'physical'],
      prices: {
        adult: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        youth: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        instructor: { subscription: 14.99, ebook: 68.99, physical: 79.99 }
      }
    },
    {
      id: 'dinner',
      name: 'Dinner Series',
      subtitle: 'Finding Your Purpose',
      available: false,
      comingSoon: 'Q1 2026',
      frontCover: '/covers/breakfast-adult-front.jpg', // Placeholder
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription', 'ebook', 'physical'],
      prices: {
        adult: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        youth: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        instructor: { subscription: 14.99, ebook: 68.99, physical: 79.99 }
      }
    },
    {
      id: 'supper',
      name: 'Supper Series',
      subtitle: 'Maturity in Faith',
      available: false,
      comingSoon: 'Q2 2026',
      frontCover: '/covers/breakfast-adult-front.jpg', // Placeholder
      editions: ['adult', 'youth', 'instructor'],
      formats: ['subscription', 'ebook', 'physical'],
      prices: {
        adult: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        youth: { subscription: 9.99, ebook: 31.99, physical: 39.99 },
        instructor: { subscription: 14.99, ebook: 68.99, physical: 79.99 }
      }
    }
  ];

  const merchandise = [
    {
      id: 'leather-bookmark',
      name: 'Bygone Leather Bookmark',
      subtitle: 'Personalized with your initial',
      image: 'https://m.media-amazon.com/images/I/71xRvB7qZNL._AC_SL1500_.jpg',
      price: 1.50,
      bundlePrice: { qty: 3, price: 3.00 }
    },
    {
      id: 'metal-bookmark',
      name: 'Metal Artistic Bookmark',
      subtitle: 'Decorative design',
      image: 'https://m.media-amazon.com/images/I/71J8gYvJQ2L._AC_SL1500_.jpg',
      price: 1.50,
      bundlePrice: { qty: 3, price: 3.00 }
    },
    {
      id: 'soul-food-pen',
      name: 'Soul Food "Truth Served Daily" Pen',
      subtitle: 'Medium tip with stylus (Black or Blue ink)',
      image: 'https://m.media-amazon.com/images/I/61wHm7zVwBL._AC_SL1500_.jpg',
      price: 4.00,
      bundlePrice: { qty: 5, price: 25.00 }
    }
  ];

  // State for each product's selections
  const [selections, setSelections] = useState({});

  const updateSelection = (productId, field, value) => {
    setSelections(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        // Reset format if edition changes
        ...(field === 'edition' ? { format: null } : {})
      }
    }));
  };

  const getPrice = (product) => {
    const selection = selections[product.id] || {};
    const edition = selection.edition || product.editions[0];
    const format = selection.format || 'ebook';
    return product.prices[edition]?.[format] || 0;
  };

  const handleAddToCart = (product) => {
    const selection = selections[product.id] || {};
    const edition = selection.edition || product.editions[0];
    const format = selection.format || 'ebook';
    const quantity = selection.quantity || 1;
    const price = getPrice(product);

    addToCart({
      id: `${product.id}-${edition}-${format}`,
      name: `${product.name} - ${edition.toUpperCase()} - ${format.toUpperCase()}`,
      price: price,
      quantity: quantity,
      image: product.frontCover
    });

    toast.success(`Added ${quantity}x ${product.name} to cart!`);
  };

  const handleMerchandiseAdd = (item) => {
    const selection = selections[item.id] || {};
    const quantity = selection.quantity || 1;
    const inkColor = selection.inkColor || 'black';

    addToCart({
      id: `${item.id}-${inkColor}`,
      name: item.id === 'soul-food-pen' ? `${item.name} (${inkColor} ink)` : item.name,
      price: item.price,
      quantity: quantity,
      image: item.image
    });

    toast.success(`Added ${quantity}x ${item.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Home</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Quick Order</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            🚀 Quick Order
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Know what you want? Select your items below and add them to your cart in seconds!
          </p>
        </div>

        {/* Soul Food Series */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">📚 Soul Food Series</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="relative">
                  {!product.available && (
                    <Badge className="absolute top-4 right-4 bg-amber-500">
                      Pre-Order {product.comingSoon}
                    </Badge>
                  )}
                  {product.badge && (
                    <Badge className="absolute top-4 right-4 bg-emerald-500">
                      {product.badge}
                    </Badge>
                  )}
                  <img 
                    src={product.frontCover} 
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-slate-600">{product.subtitle}</p>
                </CardHeader>
                <CardContent>
                  {/* Edition Selector */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Edition:</label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      value={selections[product.id]?.edition || product.editions[0]}
                      onChange={(e) => updateSelection(product.id, 'edition', e.target.value)}
                    >
                      {product.editions.map(ed => (
                        <option key={ed} value={ed}>
                          {ed === 'adult' ? 'Adult Edition (AE)' :
                           ed === 'youth' ? 'Youth Edition (YE)' :
                           ed === 'instructor' ? 'Instructor Edition (IE)' :
                           ed === 'adult-youth-bundle' ? 'Adult + Youth Bundle' : ed}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Format Selector */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Format:</label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      value={selections[product.id]?.format || product.formats[0]}
                      onChange={(e) => updateSelection(product.id, 'format', e.target.value)}
                    >
                      {product.formats.map(fmt => (
                        <option key={fmt} value={fmt}>
                          {fmt === 'subscription' ? 'Monthly Subscription' :
                           fmt === 'ebook' ? 'Digital eBook' :
                           fmt === 'physical' ? 'Physical Book' : fmt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Quantity:</label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSelection(product.id, 'quantity', Math.max(1, (selections[product.id]?.quantity || 1) - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-semibold">
                        {selections[product.id]?.quantity || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSelection(product.id, 'quantity', (selections[product.id]?.quantity || 1) + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-purple-600">
                      ${getPrice(product).toFixed(2)}
                      {(selections[product.id]?.format || product.formats[0]) === 'subscription' && (
                        <span className="text-sm text-slate-600">/mo</span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700"
                      disabled={!product.available}
                    >
                      {product.available ? 'Add to Cart' : 'Coming Soon'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Merchandise Section */}
        <section>
          <h3 className="text-2xl font-bold mb-6 text-slate-800">🎁 Merchandise</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {merchandise.map(item => (
              <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-48 object-contain rounded-lg mb-4 bg-white"
                  />
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-slate-600">{item.subtitle}</p>
                </CardHeader>
                <CardContent>
                  {/* Pen Color Selector */}
                  {item.id === 'soul-food-pen' && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Ink Color:</label>
                      <select
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        value={selections[item.id]?.inkColor || 'black'}
                        onChange={(e) => updateSelection(item.id, 'inkColor', e.target.value)}
                      >
                        <option value="black">Black Ink</option>
                        <option value="blue">Blue Ink</option>
                      </select>
                    </div>
                  )}

                  {/* Leather Bookmark Initial */}
                  {item.id === 'leather-bookmark' && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Your Initial:</label>
                      <input
                        type="text"
                        maxLength="1"
                        placeholder="A"
                        className="w-full p-2 border border-slate-300 rounded-lg uppercase"
                        value={selections[item.id]?.initial || ''}
                        onChange={(e) => updateSelection(item.id, 'initial', e.target.value.toUpperCase())}
                      />
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Quantity:</label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSelection(item.id, 'quantity', Math.max(1, (selections[item.id]?.quantity || 1) - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-semibold">
                        {selections[item.id]?.quantity || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSelection(item.id, 'quantity', (selections[item.id]?.quantity || 1) + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="mb-3 text-sm text-slate-600">
                    <div>${item.price.toFixed(2)} each</div>
                    {item.bundlePrice && (
                      <div className="text-emerald-600 font-semibold">
                        {item.bundlePrice.qty} for ${item.bundlePrice.price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <Button
                    onClick={() => handleMerchandiseAdd(item)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Bulk Order Info */}
        <section className="mt-12">
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-900">🎉 Bulk Order Bonuses!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-4xl mb-2">📦</div>
                  <div className="font-bold text-lg mb-2">10+ Books</div>
                  <div className="text-emerald-600 font-semibold">2 FREE Pens</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-4xl mb-2">📚</div>
                  <div className="font-bold text-lg mb-2">50+ Books</div>
                  <div className="text-emerald-600 font-semibold">10 FREE Pens</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="text-4xl mb-2">🎁</div>
                  <div className="font-bold text-lg mb-2">Holiday Box Set</div>
                  <div className="text-emerald-600 font-semibold">1 FREE Bookmark</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default QuickOrder;
