import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, Truck, CheckCircle, Clock, Plus, Minus, Trash2, MapPin, CreditCard, ChevronRight, ArrowLeft, X, Copy } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { placeOrder, fetchOrderById } from '../lib/api'
import { supabase, subscribeToOrder, fetchDeliveryPartnerById } from '../lib/supabase'
import { ZONES } from '../utils/constants'
import { formatPrice } from '../utils/helpers'
import './Order.css'

const DELIVERY_CHARGE = 20

// Add this helper function before the Order component
const checkZoneAvailability = async (zone) => {
  const { data, error } = await supabase
    .from('cooks')
    .select('id')
    .eq('zone', zone)
    .eq('is_available', true)
    .limit(1)
  
  if (error) {
    console.error('Error checking zone availability:', error)
    return false
  }
  
  return data && data.length > 0
}

function StepBar({ step }) {
  const steps = ['Cart', 'Address', 'Payment', 'Confirm']
  return (
    <div className="step-bar">
      {steps.map((label, i) => {
        const num = i + 1
        const active = num === step
        const done = num < step
        return (
          <div key={label} className="step-item">
            <div className={`step-circle ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              {done ? <CheckCircle size={14} /> : num}
            </div>
            <span className={`step-label ${active ? 'active' : ''}`}>{label}</span>
            {i < steps.length - 1 && <div className={`step-connector ${done ? 'done' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

function CartStep({ items, updateQuantity, removeItem, cartTotal, onNext }) {
  const grandTotal = cartTotal + DELIVERY_CHARGE
  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add items from the menu!</p>
      </div>
    )
  }
  return (
    <div className="step-content">
      <div className="cart-items-list">
        {items.map((item) => (
          <div key={item.id} className="cart-row">
            <div className="cart-row-info">
              <div className="cart-row-name">{item.name}</div>
              <div className="cart-row-unit">{formatPrice(item.price)} each</div>
            </div>
            <div className="cart-row-controls">
              <button
                className="qty-btn"
                onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                aria-label="decrease"
              >
                {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="increase">
                <Plus size={14} />
              </button>
            </div>
            <div className="cart-row-price">{formatPrice(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>
      <div className="cart-total-row">
        <span>Subtotal</span>
        <span>{formatPrice(cartTotal)}</span>
      </div>
      <div className="cart-total-row delivery-row">
        <span>Delivery charge</span>
        <span className="delivery-charge">+{formatPrice(DELIVERY_CHARGE)}</span>
      </div>
      <div className="cart-total-row grand-total-row">
        <span>Total</span>
        <span className="cart-total-val">{formatPrice(grandTotal)}</span>
      </div>
      <div className="delivery-notice">
        A delivery charge of {formatPrice(DELIVERY_CHARGE)} has been added to support our delivery partners.
      </div>
      <button className="primary-btn" onClick={onNext}>
        Proceed to Address <ChevronRight size={16} />
      </button>
    </div>
  )
}

function AddressStep({ form, setForm, savedAddresses, onNext, onBack, error, setError }) {
  const [useNew, setUseNew] = useState(!savedAddresses?.length)
  const [selectedSaved, setSelectedSaved] = useState(savedAddresses?.[0] || null)
  const [availableZones, setAvailableZones] = useState([])
  const [checkingZone, setCheckingZone] = useState(false)

  // Fetch available zones on mount
  useEffect(() => {
    const fetchAvailableZones = async () => {
      const { data } = await supabase
        .from('cooks')
        .select('zone')
        .eq('is_available', true)
      
      const uniqueZones = [...new Set(data?.map(c => c.zone) || [])]
      setAvailableZones(uniqueZones)
    }
    fetchAvailableZones()
  }, [])

  useEffect(() => {
    if (savedAddresses?.length && savedAddresses[0]) {
      setSelectedSaved(savedAddresses[0])
      setForm(prev => ({
        ...prev,
        address: savedAddresses[0].full_address,
        zone: savedAddresses[0].zone
      }))
    }
  }, [savedAddresses])

  const handleSelectSaved = (addr) => {
    setSelectedSaved(addr)
    setForm(prev => ({ ...prev, address: addr.full_address, zone: addr.zone }))
    setError(null)
  }

  const handleSwitchToNew = () => {
    setUseNew(true)
    setForm(prev => ({ ...prev, address: '', zone: ZONES[0] }))
    setError(null)
  }

  const handleSwitchToSaved = () => {
    setUseNew(false)
    if (selectedSaved) {
      setForm(prev => ({ ...prev, address: selectedSaved.full_address, zone: selectedSaved.zone }))
    }
    setError(null)
  }

  const handleProceed = async () => {
    // Basic validation
    if (useNew) {
      if (!form.name.trim() || !form.mobile_no.trim() || !form.address.trim()) {
        setError('Please fill in all required fields.')
        return
      }
    } else {
      if (!form.address.trim()) {
        setError('Please select a delivery address.')
        return
      }
    }
    
    // Check zone availability
    setCheckingZone(true)
    const hasAvailableCooks = await checkZoneAvailability(form.zone)
    setCheckingZone(false)
    
    if (!hasAvailableCooks) {
      const availableZonesList = availableZones.length > 0 
        ? availableZones.join(', ') 
        : 'other areas'
      setError(`Sorry, we don't have cooks available in ${form.zone} right now. Please try ${availableZonesList} or check back later.`)
      return
    }
    
    setError(null)
    onNext()
  }

  const isZoneAvailable = (zone) => availableZones.includes(zone)

  return (
    <div className="step-content">
      {savedAddresses?.length > 0 && (
        <div className="address-toggle">
          <button className={`toggle-pill ${!useNew ? 'active' : ''}`} onClick={handleSwitchToSaved}>Saved Addresses</button>
          <button className={`toggle-pill ${useNew ? 'active' : ''}`} onClick={handleSwitchToNew}>New Address</button>
        </div>
      )}

      {!useNew && savedAddresses?.length > 0 ? (
        <div className="saved-addresses">
          {savedAddresses.map((addr, i) => (
            <label key={i} className={`saved-addr-card ${selectedSaved === addr ? 'selected' : ''}`}>
              <input type="radio" name="saved_addr" checked={selectedSaved === addr} onChange={() => handleSelectSaved(addr)} />
              <MapPin size={16} />
              <div>
                <div className="addr-label">{addr.label || 'Address ' + (i + 1)}</div>
                <div className="addr-full">{addr.full_address}</div>
                <div className="addr-zone">
                  {addr.zone}
                  {!isZoneAvailable(addr.zone) && <span className="zone-unavailable-badge"> ⚠️ Currently unavailable</span>}
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="checkout-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full name *</label>
              <input name="name" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError(null) }} placeholder="Rahul Sharma" />
            </div>
            <div className="form-group">
              <label>Mobile Number *</label>
              <input name="mobile_no" value={form.mobile_no} onChange={e => { setForm(p => ({ ...p, mobile_no: e.target.value })); setError(null) }} placeholder="+91 98XXX XXXXX" />
            </div>
          </div>
          <div className="form-group">
            <label>Delivery Address *</label>
            <textarea name="address" value={form.address} onChange={e => { setForm(p => ({ ...p, address: e.target.value })); setError(null) }} placeholder="House no., Street, Area..." rows={3} />
          </div>
          <div className="form-group">
            <label>Zone</label>
            <select name="zone" value={form.zone} onChange={e => { setForm(p => ({ ...p, zone: e.target.value })); setError(null) }}>
              {ZONES.map(z => (
                <option key={z} value={z}>
                  {z} {!isZoneAvailable(z) ? '⚠️ (Not available)' : '✓'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Warning message if selected zone is unavailable */}
      {!isZoneAvailable(form.zone) && (
        <div className="zone-warning">
          ⚠️ No cooks currently available in {form.zone}. Your order may take longer than usual, or you can choose from available zones: {availableZones.join(', ') || 'None available right now'}
        </div>
      )}

      {error && <div className="form-error">{error}</div>}
      <div className="btn-row">
        <button className="secondary-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button className="primary-btn" onClick={handleProceed} disabled={checkingZone}>
          {checkingZone ? 'Checking availability...' : 'Continue to Payment'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function UpiModal({ total, onConfirm, onClose }) {
  const upiId = 'motherstouchtiffin@upi'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 className="modal-title">Pay via UPI</h2>
        <p className="modal-subtitle">Complete your payment of <strong>{formatPrice(total)}</strong> using any UPI app</p>

        <div className="upi-qr-placeholder">
          <div className="qr-mock">
            <div className="qr-inner">QR CODE TO BE HERE</div>
            <p>Scan with any UPI app</p>
          </div>
        </div>

        <div className="upi-id-row">
          <span className="upi-id-label">UPI ID</span>
          <span className="upi-id-value">{upiId}</span>
          <button className="upi-copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : <><Copy size={13} /> Copy</>}
          </button>
        </div>

        <p className="upi-apps-label">Pay using</p>
        <div className="upi-apps-row">
          {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
            <span key={app} className="upi-app-pill">{app}</span>
          ))}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={onConfirm}>
            I've Paid · <CheckCircle size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentStep({ form, setForm, cartTotal, onNext, onBack }) {
  const grandTotal = cartTotal + DELIVERY_CHARGE
  const [showUpiModal, setShowUpiModal] = useState(false)

  const handleNext = () => {
    if (form.payment === 'upi') {
      setShowUpiModal(true)
    } else {
      onNext()
    }
  }

  return (
    <div className="step-content">
      {showUpiModal && (
        <UpiModal
          total={grandTotal}
          onConfirm={() => { setShowUpiModal(false); onNext() }}
          onClose={() => setShowUpiModal(false)}
        />
      )}

      <div className="payment-options-grid">
        {[
          { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your food arrives' },
          { value: 'upi', label: 'UPI', desc: 'Pay via Google Pay, PhonePe, etc.' }
        ].map(opt => (
          <label key={opt.value} className={`payment-card ${form.payment === opt.value ? 'selected' : ''}`}>
            <input type="radio" name="payment" value={opt.value} checked={form.payment === opt.value} onChange={() => setForm(p => ({ ...p, payment: opt.value }))} />
            <span className="pay-icon">{opt.icon}</span>
            <div>
              <div className="pay-label">{opt.label}</div>
              <div className="pay-desc">{opt.desc}</div>
            </div>
            <div className={`pay-check ${form.payment === opt.value ? 'visible' : ''}`}><CheckCircle size={18} /></div>
          </label>
        ))}
      </div>

      <div className="payment-summary">
        <div className="ps-row"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
        <div className="ps-row">
          <span>Delivery charge</span>
          <span className="delivery-charge">+{formatPrice(DELIVERY_CHARGE)}</span>
        </div>
        <div className="ps-row total"><span>Total Payable</span><span>{formatPrice(grandTotal)}</span></div>
      </div>

      <div className="delivery-notice">
        A delivery charge of {formatPrice(DELIVERY_CHARGE)} supports our delivery partners.
      </div>

      <div className="btn-row">
        <button className="secondary-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button className="primary-btn" onClick={handleNext}>
          {form.payment === 'upi' ? 'Pay Now' : 'Review Order'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function ConfirmStep({ form, items, cartTotal, onPlace, placing, onBack, error }) {
  const grandTotal = cartTotal + DELIVERY_CHARGE
  return (
    <div className="step-content">
      <div className="confirm-section">
        <h3 className="confirm-heading"><MapPin size={16} /> Delivery To</h3>
        <div className="confirm-detail">{form.name} · {form.mobile_no}</div>
        <div className="confirm-detail muted">{form.address}, {form.zone}</div>
      </div>
      <div className="confirm-section">
        <h3 className="confirm-heading"><CreditCard size={16} /> Payment</h3>
        <div className="confirm-detail">{form.payment === 'cod' ? 'Cash on Delivery' : 'UPI (Paid)'}</div>
      </div>
      <div className="confirm-section">
        <h3 className="confirm-heading"><Package size={16} /> Your Items</h3>
        {items.map((item, i) => (
          <div key={i} className="confirm-item">
            <span>{item.name} × {item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="confirm-item">
          <span>Delivery charge</span>
          <span className="delivery-charge">+{formatPrice(DELIVERY_CHARGE)}</span>
        </div>
        <div className="confirm-item total">
          <span>Total</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="btn-row">
        <button className="secondary-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button className="primary-btn place-btn" onClick={onPlace} disabled={placing}>
          {placing ? 'Placing Order...' : `Place Order · ${formatPrice(grandTotal)}`}
        </button>
      </div>
    </div>
  )
}

function TrackingView({ order, cook, deliveryPartner, loadingPartners }) {
  const statusSteps = [
    { step: 1, icon: Clock,       label: 'Order Placed',     sublabel: 'Your order has been received' },
    { step: 2, icon: Package,     label: 'Preparing',        sublabel: 'Cook is preparing your meal' },
    { step: 3, icon: Package,     label: 'Ready for Pickup', sublabel: 'Meal is packed and ready' },
    { step: 4, icon: Truck,       label: 'Out for Delivery', sublabel: 'Partner on the way' },
    { step: 5, icon: CheckCircle, label: 'Delivered',        sublabel: 'Enjoy your meal!' }
  ]
  const getStatusStep = (status) => ({
    pending: 1, confirmed: 2, preparing: 2, ready: 3, dispatched: 4, picked: 4, delivered: 5
  }[status] || 1)
  const currentStep = getStatusStep(order?.status || 'pending')

  return (
    <div className="order-content">
      <div className="order-main">
        <div className="status-card">
          <h2>Order Status</h2>
          <div className="status-timeline">
            {statusSteps.map((item) => {
              const Icon = item.icon
              const isCompleted = item.step <= currentStep
              const isCurrent = item.step === currentStep
              return (
                <div key={item.step} className={`status-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="status-icon-wrapper">
                    <div className="status-icon"><Icon size={20} /></div>
                    {item.step < 5 && <div className="status-line" />}
                  </div>
                  <div className="status-content">
                    <div className="status-label">{item.label}</div>
                    <div className="status-sublabel">{item.sublabel}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="info-card">
          <h3>Your Cook</h3>
          {loadingPartners ? (
            <div className="partner-skeleton">Finding your cook...</div>
          ) : cook ? (
            <div className="cook-info">
              <div className="cook-avatar">{cook.name?.charAt(0)}</div>
              <div>
                <div className="cook-name">{cook.name}</div>
                <div className="cook-meta">⭐ {cook.rating} · {cook.zone}</div>
              </div>
            </div>
          ) : (
            <div className="partner-skeleton">Waiting for a cook to accept...</div>
          )}
        </div>

        <div className="info-card">
          <h3>Delivery Partner</h3>
          {loadingPartners ? (
            <div className="partner-skeleton">Finding delivery partner...</div>
          ) : deliveryPartner ? (
            <div className="delivery-info">
              <div className="delivery-avatar">{deliveryPartner.name?.charAt(0)}</div>
              <div>
                <div className="delivery-name">{deliveryPartner.name}</div>
                <div className="delivery-phone">{deliveryPartner.phone}</div>
              </div>
            </div>
          ) : (
            <div className="partner-skeleton">Waiting for a delivery partner...</div>
          )}
        </div>
      </div>

      <div className="order-sidebar">
        <div className="summary-card">
          <h3>Order Summary</h3>
          <div className="order-items">
            {order?.items?.map((item, i) => (
              <div key={i} className="order-item">
                <div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-qty">Qty: {item.quantity}</div>
                </div>
                <div className="item-price">{formatPrice(item.price)}</div>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>Total Amount</span>
            <span className="total-amount">{formatPrice(order?.total)}</span>
          </div>
        </div>
        <div className="address-card">
          <h3>Delivery Address</h3>
          <p>{order?.delivery_address || order?.address}</p>
        </div>
        <div className="time-card">
          <div className="time-label">Estimated Delivery</div>
          <div className="time-value">~45 min</div>
        </div>
      </div>
    </div>
  )
}

export default function Order() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, clearCart } = useCartStore()
  const { user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: user?.user_metadata?.name || '',
    mobile_no: '',
    address: '',
    zone: ZONES[0],
    payment: 'cod'
  })
  const [error, setError] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [cook, setCook] = useState(null)
  const [deliveryPartner, setDeliveryPartner] = useState(null)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])

  useEffect(() => {
    if (!user?.id) return
    
    // Fetch saved addresses from user metadata
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSavedAddresses(user?.user_metadata?.saved_addresses || [])
    })
    
    // Fetch mobile_no from profiles table
    supabase
      .from('profiles')
      .select('mobile_no, phone')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          const phoneNumber = data.mobile_no || data.phone || ''
          setForm(prev => ({
            ...prev,
            mobile_no: phoneNumber
          }))
        } else {
          console.error('Failed to fetch profile:', error)
        }
      })
  }, [user?.id])

  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const grandTotal = cartTotal + DELIVERY_CHARGE

  useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) return
    fetchOrderById(id)
      .then(data => { if (data) setPlacedOrder(data) })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!placedOrder) return
    setLoadingPartners(true)

    async function loadPartners() {
      try {
        if (placedOrder.cook_id) {
          const { data } = await supabase
            .from('cooks')
            .select('id, name, zone, rating')
            .eq('id', placedOrder.cook_id)
            .maybeSingle()
          setCook(data)
        } else {
          setCook(null)
        }

        // Only show delivery partner once they've accepted (delivery_partner_id set)
        if (placedOrder.delivery_partner_id) {
          const partner = await fetchDeliveryPartnerById(placedOrder.delivery_partner_id)
          setDeliveryPartner(partner)
        } else {
          setDeliveryPartner(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingPartners(false)
      }
    }

    loadPartners()
  }, [placedOrder?.id, placedOrder?.cook_id, placedOrder?.delivery_partner_id, placedOrder?.status])

  // Realtime subscription + polling fallback
  useEffect(() => {
    if (!placedOrder?.id) return

    const poll = setInterval(() => {
      fetchOrderById(placedOrder.id)
        .then(updated => { if (updated) setPlacedOrder(updated) })
        .catch(() => {})
    }, 30000)

    const channel = subscribeToOrder(placedOrder.id, (updated) => {
      setPlacedOrder(updated)
    })

    return () => {
      clearInterval(poll)
      channel.unsubscribe()
    }
  }, [placedOrder?.id])

  const handlePlace = async () => {
    setPlacing(true)
    setError(null)
    try {
      const result = await placeOrder({
        customer_name:  form.name || user?.user_metadata?.name || 'Customer',
        mobile_no:      form.mobile_no || '',
        address:        form.address,
        zone:           form.zone,
        payment_method: form.payment,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total: Math.round(grandTotal),
        ...(user?.id ? { customer_id: user.id } : {})
      })
      clearCart()
      setPlacedOrder(result)
    } catch (err) {
      setError('Failed to place order. Please try again.')
      console.error(err)
    } finally {
      setPlacing(false)
    }
  }

  if (placedOrder) {
    return (
      <div className="order-page">
        <Navbar />
        <div className="order-container">
          <div className="order-header">
            <h1>Track Your Order</h1>
            <p className="order-id">Order #{placedOrder.id}</p>
          </div>
          <TrackingView
            order={placedOrder}
            cook={cook}
            deliveryPartner={deliveryPartner}
            loadingPartners={loadingPartners}
          />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="order-page">
      <Navbar />
      <div className="order-container checkout-container">
        <div className="order-header"><h1>Checkout</h1></div>
        <StepBar step={step} />
        <div className="checkout-body">
          <div className="checkout-main">
            <div className="status-card">
              {step === 1 && <CartStep items={items} updateQuantity={updateQuantity} removeItem={removeItem} cartTotal={cartTotal} onNext={() => setStep(2)} />}
              {step === 2 && <AddressStep form={form} setForm={setForm} savedAddresses={savedAddresses} onNext={() => setStep(3)} onBack={() => setStep(1)} error={error} setError={setError} />}
              {step === 3 && <PaymentStep form={form} setForm={setForm} cartTotal={cartTotal} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
              {step === 4 && <ConfirmStep form={form} items={items} cartTotal={cartTotal} onPlace={handlePlace} placing={placing} onBack={() => setStep(3)} error={error} />}
            </div>
          </div>
          {items.length > 0 && (
            <div className="order-sidebar">
              <div className="summary-card">
                <h3>Order Summary</h3>
                <div className="order-items">
                  {items.map((item, i) => (
                    <div key={i} className="order-item">
                      <div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-qty">Qty: {item.quantity}</div>
                      </div>
                      <div className="item-price">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="order-total subtotal-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="order-total delivery-row">
                  <span>Delivery</span>
                  <span className="delivery-charge">+{formatPrice(DELIVERY_CHARGE)}</span>
                </div>
                <div className="order-total grand-total-row">
                  <span>Total</span>
                  <span className="total-amount">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}