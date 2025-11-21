import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './BeatStore.css';

interface Beat {
  id: number;
  title: string;
  artist: string;
  price: number;
  image: string | null;
  cartId?: number;
}

export default function BeatStore() {
  const navigate = useNavigate();
  const [beats] = useState<Beat[]>([
    { id: 1, title: 'Urban Dreams', artist: 'GNSVRS', price: 9.99, image: null },
    { id: 2, title: 'Midnight Vibes', artist: 'GNSVRS', price: 12.99, image: null },
    { id: 3, title: 'City Lights', artist: 'GNSVRS', price: 14.99, image: null },
    { id: 4, title: 'Neon Nights', artist: 'GNSVRS', price: 11.99, image: null },
    { id: 5, title: 'Street Flow', artist: 'GNSVRS', price: 10.99, image: null },
    { id: 6, title: 'Electric Pulse', artist: 'GNSVRS', price: 13.99, image: null },
    { id: 7, title: 'Digital Waves', artist: 'GNSVRS', price: 15.99, image: null },
    { id: 8, title: 'Future Bass', artist: 'GNSVRS', price: 12.99, image: null }
  ]);

  const [cart, setCart] = useState<Beat[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('beatstoreCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('beatstoreCart', JSON.stringify(cart));
  }, [cart]);

  // Format price
  const formatPrice = useCallback((price: number): string => {
    return parseFloat(price.toString()).toFixed(2);
  }, []);

  // Add to cart
  const addToCart = useCallback((beatId: number) => {
    const beat = beats.find(b => b.id === beatId);
    if (beat) {
      setCart(prev => [...prev, { ...beat, cartId: Date.now() + Math.random() }]);
    }
  }, [beats]);

  // Remove from cart
  const removeFromCart = useCallback((cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  // Preview beat
  const previewBeat = useCallback((beatId: number) => {
    const beat = beats.find(b => b.id === beatId);
    if (beat) {
      alert(`Preview: ${beat.title} by ${beat.artist}\n\nPreview functionality coming soon!`);
    }
  }, [beats]);

  // Checkout
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    alert(`Checkout complete!\n\nTotal: $${formatPrice(total)}\n\nThank you for your purchase!`);
    setCart([]);
    setCartModalOpen(false);
  }, [cart, formatPrice]);

  
  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Load background image
  useEffect(() => {
    const background = document.getElementById('background-container');
    const savedBgImage = localStorage.getItem('backgroundImage');
    if (savedBgImage && background) {
      background.style.backgroundImage = `url(${savedBgImage})`;
      background.style.backgroundSize = 'cover';
      background.style.backgroundPosition = 'center';
      background.style.backgroundRepeat = 'no-repeat';
    }
  }, []);

  return (
    <div className="beatstore-container">
      {/* Background Container */}
      <div id="background-container"></div>

      {/* Navigation Header */}
      <header className="store-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="store-title">BeatStore</h1>
          <button className="cart-btn" id="cartBtn" onClick={() => setCartModalOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="store-main">
        <div className="container">
          <div className="beats-grid" id="beatsGrid">
            {beats.map(beat => (
              <div key={beat.id} className="beat-tile">
                {beat.image ? (
                  <img src={beat.image} alt={beat.title} className="beat-image" />
                ) : (
                  <div className="beat-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', color: 'rgba(255,255,255,0.3)' }}>
                    🎵
                  </div>
                )}
                <div className="beat-info">
                  <h3 className="beat-title">{beat.title}</h3>
                  <p className="beat-artist">{beat.artist}</p>
                  <p className="beat-price">${formatPrice(beat.price)}</p>
                  <div className="beat-actions">
                    <button className="btn-preview" onClick={() => previewBeat(beat.id)}>
                      Preview
                    </button>
                    <button className="btn-add-cart" onClick={() => addToCart(beat.id)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Cart Modal */}
      {cartModalOpen && (
        <div className={`cart-modal ${cartModalOpen ? 'active' : ''}`}>
          <div className="modal-backdrop" onClick={() => setCartModalOpen(false)}></div>
          <div className="modal-content cart-content">
            <div className="modal-header">
              <h2>Shopping Cart</h2>
              <button className="modal-close" id="closeCart" onClick={() => setCartModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="cart-items" id="cartItems">
                {cart.length === 0 ? (
                  <p className="empty-cart">Your cart is empty</p>
                ) : (
                  cart.map(item => (
                    <div key={item.cartId} className="cart-item">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="cart-item-image" />
                      ) : (
                        <div className="cart-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'rgba(255,255,255,0.3)' }}>
                          🎵
                        </div>
                      )}
                      <div className="cart-item-info">
                        <h4 className="cart-item-title">{item.title}</h4>
                        <p className="cart-item-artist">{item.artist}</p>
                        <p className="cart-item-price">${formatPrice(item.price)}</p>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.cartId!)}>
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>Total: ${formatPrice(cartTotal)}</strong>
                </div>
                <button className="checkout-btn" id="checkoutBtn" onClick={handleCheckout}>
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



