import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { mockMenuItems } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import './Menu.css'

export default function Menu() {
  const [filter, setFilter] = useState('all')
  const [imgErrors, setImgErrors] = useState({})
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const { items, addItem, removeItem, updateQuantity } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const filteredItems = filter === 'all'
    ? mockMenuItems
    : mockMenuItems.filter(item => item.category === filter)

  const getItemQuantity = (id) => {
    const item = items.find(i => i.id === id)
    return item ? item.quantity : 0
  }

  const handleAddToCart = (item) => {
    if (!user) { setShowAuthPrompt(true); return }
    addItem(item)
  }

  const handleIncrement = (item) => {
    if (!user) { setShowAuthPrompt(true); return }
    updateQuantity(item.id, getItemQuantity(item.id) + 1)
  }

  const handleDecrement = (item) => {
    const qty = getItemQuantity(item.id)
    qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)
  }

  const handleImgError = (id) => setImgErrors(prev => ({ ...prev, [id]: true }))

  const cartTotal  = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="menu-page">
      <Navbar />

      {/* Auth prompt modal */}
      {showAuthPrompt && (
        <div className="modal-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>:P</div>
            <h2 style={{ marginBottom: 8 }}>Sign in to order</h2>
            <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
              You need an account to add items to your cart and place orders.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="secondary-btn"
                onClick={() => setShowAuthPrompt(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={() => navigate('/login')}
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="menu-hero">
        <h1>Our Menu</h1>
        <p>Fresh, home-cooked meals prepared daily by our talented cooks</p>
      </div>

      <div className="menu-container">
        <div className="menu-filters">
          {[
            { key: 'all',     label: 'All Items' },
            { key: 'thali',   label: 'Thalis'    },
            { key: 'tiffin',  label: 'Tiffins'   },
            { key: 'special', label: 'Specials'  },
          ].map(f => (
            <button
              key={f.key}
              className={filter === f.key ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filteredItems.map((item) => {
            const quantity    = getItemQuantity(item.id)
            const imageFailed = imgErrors[item.id]

            return (
              <div key={item.id} className="menu-card">
                <div className="menu-card-img">
                  {item.image_url && !imageFailed ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="menu-real-img"
                      onError={() => handleImgError(item.id)}
                    />
                  ) : (
                    <div className="menu-emoji">{item.emoji}</div>
                  )}
                  <div className="leaf-tag">Banana Leaf</div>
                </div>

                <div className="menu-card-body">
                  <div className="menu-card-header">
                    <h3 className="menu-name">{item.name}</h3>
                    <span className={item.is_veg ? 'veg-badge' : 'non-veg-badge'}>
                      {item.is_veg ? 'Pure Veg' : 'Non-Veg'}
                    </span>
                  </div>
                  <p className="menu-desc">{item.description}</p>
                  <div className="menu-footer">
                    <div className="menu-price">₹{item.price}</div>
                    {quantity === 0 ? (
                      <button className="add-btn" onClick={() => handleAddToCart(item)}>
                        <Plus size={16} /> Add
                      </button>
                    ) : (
                      <div className="quantity-controls">
                        <button onClick={() => handleDecrement(item)}><Minus size={14} /></button>
                        <span>{quantity}</span>
                        <button onClick={() => handleIncrement(item)}><Plus size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {totalItems > 0 && (
        <div className="cart-summary">
          <div className="cart-summary-content">
            <div className="cart-info">
              <ShoppingCart size={20} />
              <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              <span className="cart-divider">•</span>
              <span className="cart-total">₹{cartTotal}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={() => navigate('/order/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}