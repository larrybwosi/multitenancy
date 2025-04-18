'use client'
import { useState } from 'react';
import { Plus, Minus, ChevronLeft, Search, X, Edit, ChevronRight } from 'lucide-react';

const coffeeItems = [
  { 
    id: 1, 
    name: 'French Vanilla Fantasy', 
    price: 12.83,
    image: '/api/placeholder/100/120',
    description: 'French Vanilla Fantasy is a smooth blend of coffee with a distinctive sweet vanilla touch. Combining rich coffee flavors with a tempting vanilla aroma, each sip of French Vanilla Fantasy takes you on a flavor adventure that delights the palate and refreshes the mind.',
    ingredients: [
      'High-quality Arabica coffee',
      'Natural vanilla extract',
      'Fine granulated sugar'
    ],
    caffeineLevel: 'Moderate'
  },
  { 
    id: 2, 
    name: 'Almond Amore', 
    price: 10.54,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 3, 
    name: 'Cinnamon Swirl', 
    price: 9.92,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 4, 
    name: 'Raspberry Ripple', 
    price: 9.92,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 5, 
    name: 'Tiramisu Temptation', 
    price: 9.15,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 6, 
    name: 'White Chocolate Wonder', 
    price: 10.54,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 7, 
    name: 'Dark Roast Dynamite', 
    price: 10.03,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 8, 
    name: 'Irish Cream Infusion', 
    price: 11.63,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 9, 
    name: 'Pumpkin Spice Perfection', 
    price: 12.75,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 10, 
    name: 'Cinnamon Comfort', 
    price: 12.35,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 11, 
    name: 'Ethiopian Emerald', 
    price: 12.83,
    image: '/api/placeholder/100/120'
  },
  { 
    id: 12, 
    name: 'Decaf Delight', 
    price: 10.54,
    image: '/api/placeholder/100/120'
  }
];

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  sugar: string;
};

type ProductDetailProps = {
  product: any;
  onClose: () => void;
};

const ProductDetail = ({ product, onClose }: ProductDetailProps) => {
  const [packageSize, setPackageSize] = useState('Small (hot)');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg font-medium">Detail Product</h2>
          <button onClick={onClose} className="p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-4">
            <img src={product.image} alt={product.name} className="w-16 h-16 mr-4" />
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="mt-2 text-lg font-medium">${product.price.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Description</h4>
            <p className="text-sm text-gray-600">{product.description}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Ingredients</h4>
            <ul className="text-sm text-gray-600 list-disc pl-5">
              {product?.ingredients?.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Caffeine Level</h4>
            <p className="text-sm text-gray-600">{product.caffeineLevel}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Package Size</h4>
            <div className="flex space-x-2 text-sm">
              <button 
                className={`px-3 py-1 border rounded ${packageSize === 'Small (hot)' ? 'bg-gray-100' : ''}`}
                onClick={() => setPackageSize('Small (hot)')}
              >
                Small (hot)
              </button>
              <button 
                className={`px-3 py-1 border rounded ${packageSize === 'Medium (hot)' ? 'bg-gray-100' : ''}`}
                onClick={() => setPackageSize('Medium (hot)')}
              >
                Medium (hot)
              </button>
              <button 
                className={`px-3 py-1 border rounded ${packageSize === 'Large (hot)' ? 'bg-gray-100' : ''}`}
                onClick={() => setPackageSize('Large (hot)')}
              >
                Large (hot)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CoffeeShopApp = () => {
  const [activeTab, setActiveTab] = useState('Coffee');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: 'French Vanilla Fantasy', price: 12.83, quantity: 2, size: 'Small', sugar: 'Sugar Normal' },
    { id: 8, name: 'Irish Cream Infusion', price: 12.83, quantity: 4, size: 'Small', sugar: 'Sugar Normal' }
  ]);
  
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;
  
  const handleQuantityChange = (id: number, change: number) => {
    setCart(cart?.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + change) } 
        : item
    ));
  };
  
  const openProductDetail = (product: any) => {
    setSelectedProduct(product);
  };
  
  const closeProductDetail = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Menu */}
      <div className="w-2/3 bg-white overflow-auto">
        <div className="p-4 border-b">
          <div className="flex items-center mb-4">
            <ChevronLeft size={20} />
            <p className="ml-2 text-sm">American Coffee</p>
            <div className="ml-1 px-2 py-0.5 text-xs border border-gray-300 rounded">Open</div>
            <div className="ml-auto flex items-center">
              <div className="p-1 border border-gray-300 rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3z"></path>
                  <path d="M21 9H3"></path>
                </svg>
              </div>
              <div className="ml-2 p-1 border border-gray-300 rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-2">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text"
              className="bg-transparent ml-2 w-full text-sm outline-none"
              placeholder="Search..."
            />
          </div>
        </div>
        
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <button 
              className={`px-4 py-2 whitespace-nowrap flex items-center ${activeTab === 'Coffee' ? 'border-b-2 border-amber-500' : ''}`}
              onClick={() => setActiveTab('Coffee')}
            >
              <span className="mr-1">Coffee</span>
              {activeTab === 'Coffee' && <div className="w-4 h-4 rounded-full bg-amber-500 text-xs text-white flex items-center justify-center">6</div>}
            </button>
            <button 
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'Snack' ? 'border-b-2 border-amber-500' : ''}`}
              onClick={() => setActiveTab('Snack')}
            >
              Snack
            </button>
            <button 
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'Promo' ? 'border-b-2 border-amber-500' : ''}`}
              onClick={() => setActiveTab('Promo')}
            >
              Promo
            </button>
            <button 
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'Special Beverage' ? 'border-b-2 border-amber-500' : ''}`}
              onClick={() => setActiveTab('Special Beverage')}
            >
              Special Beverage
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 p-4">
          {coffeeItems?.map((item) => (
            <div key={item.id} className="relative bg-white rounded-lg overflow-hidden border">
              <button 
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm"
                onClick={() => openProductDetail(item)}
              >
                <ChevronRight size={16} />
              </button>
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-24 object-cover"
              />
              <div className="p-2">
                <h3 className="text-sm font-medium truncate">{item.name}</h3>
                <p className="text-sm mt-1">${item.price.toFixed(2)}</p>
                <div className="mt-2 flex justify-between items-center">
                  <button className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Right Panel - Order Details */}
      <div className="w-1/3 bg-white border-l overflow-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <button className="flex items-center text-sm font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12V8H6a2 2 0 01-2-2V6c0-1.1.9-2 2-2h14v4"></path>
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                <path d="M18 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
              </svg>
              <span className="ml-2">Order Details</span>
            </button>
            
            <div className="flex">
              <button className="mr-2 text-sm flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <path d="M22 6l-10 7L2 6"></path>
                </svg>
                <span className="ml-1">Reset Order</span>
              </button>
              
              <button className="text-sm flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
                <span className="ml-1">Dine In</span>
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {cart?.map((item) => (
            <div key={item.id} className="flex items-center mb-4 bg-white p-2 rounded-lg shadow-sm">
              <img 
                src="/api/placeholder/80/80" 
                alt={item.name} 
                className="w-12 h-12 object-cover mr-3"
              />
              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.size} · {item.sugar}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm">${item.price.toFixed(2)}</p>
                  <div className="flex items-center">
                    <button className="p-1 text-gray-400">
                      <Edit size={14} />
                    </button>
                    <button 
                      className="p-1"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="mx-2 text-sm">{item.quantity}</span>
                    <button 
                      className="p-1"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-auto p-4 border-t">
          <div className="mb-1 flex justify-between text-sm">
            <span>Sub Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Discount</span>
            <span className="flex items-center">
              <span>-</span>
              <ChevronRight size={16} className="ml-1" />
            </span>
          </div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Tax 12%</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Total Payment</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm">
            <span>Add Discount</span>
            <ChevronRight size={16} />
          </div>
          
          <div className="flex justify-between text-sm mb-4">
            <span>Select Table</span>
            <button className="bg-black text-white px-3 py-1 rounded text-xs">Select</button>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex-1 bg-amber-500 text-white py-3 rounded-lg text-sm font-medium">
              Pay Now
            </button>
            <button className="flex-1 border border-gray-300 py-3 rounded-lg text-sm font-medium">
              Open Bill
            </button>
          </div>
        </div>
      </div>
      
      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={closeProductDetail} />
      )}
    </div>
  );
};

export default CoffeeShopApp;