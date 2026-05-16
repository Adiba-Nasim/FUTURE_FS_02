import { useState, useEffect } from 'react'
import { MapPin, Phone, Navigation, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/authStore'
import './Deliverydashboard.css'
import {
  fetchReadyOrders,
  acceptOrder,
  completeOrder,
  subscribeToOrders,
  fetchDeliveryPartnerProfile
} from '../lib/supabase'

export default function DeliveryDashboard() {
  const [availableOrders, setAvailableOrders] = useState([])
  const [activeDelivery, setActiveDelivery] = useState(null)
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()

  const partnername = partnerProfile?.name || user?.user_metadata?.name || 'Delivery Partner'

  useEffect(() => {
    if (!user?.id) return
    let channel

    async function init() {
      try {
        setLoading(true)
        setError(null)

        const profile = await fetchDeliveryPartnerProfile(user.id)
        if (!profile) {
          setError('No delivery partner profile found for your account. Please contact admin.')
          setLoading(false)
          return
        }
        setPartnerProfile(profile)

        const orders = await fetchReadyOrders()
        setAvailableOrders(orders)
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError('Could not load orders. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    init()

    channel = subscribeToOrders({
      onNewOrder: (newOrder) => {
        setAvailableOrders(prev => {
          const exists = prev.some(o => o.id === newOrder.id)
          if (exists) return prev.map(o => o.id === newOrder.id ? newOrder : o)
          return [newOrder, ...prev]
        })
      },
      onOrderGone: (orderId) => {
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId))
        setActiveDelivery(prev => prev?.id === orderId ? null : prev)
      }
    })

    return () => { channel?.unsubscribe() }
  }, [user?.id])

  const handleAcceptDelivery = async (order) => {
    if (!partnerProfile?.id) {
      alert('Your delivery partner profile could not be loaded. Please refresh.')
      return
    }
    setActiveDelivery(order)
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id))
    try {
      await acceptOrder(order.id, partnerProfile.id)
    } catch (err) {
      console.error('Failed to accept order:', err)
      setActiveDelivery(null)
      setAvailableOrders(prev => [order, ...prev])
    }
  }

  const handleCompleteDelivery = async () => {
    if (!activeDelivery) return
    try {
      await completeOrder(activeDelivery.id)
      setActiveDelivery(null)
    } catch (err) {
      console.error('Failed to complete order:', err)
    }
  }

  const handleOpenMaps = (order) => {
    const pickup = encodeURIComponent(`Cook's Kitchen, ${order.zone}, Jamshedpur, Jharkhand`)
    const destination = encodeURIComponent(order.address || `${order.zone}, Jamshedpur`)
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${destination}&travelmode=driving`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handlePreviewPickup = (order) => {
    const pickup = encodeURIComponent(`Cook's Kitchen, ${order.zone}, Jamshedpur, Jharkhand`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${pickup}`, '_blank', 'noopener,noreferrer')
  }

  const formatItems = (items) => {
    if (!items) return '—'
    if (typeof items === 'string') return items
    if (Array.isArray(items)) return items.map(i => `${i.name} x${i.quantity}`).join(', ')
    return JSON.stringify(items)
  }

  return (
    <div className="delivery-dashboard">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Delivery Partner Dashboard</h1>
            <p className="welcome-text">Welcome, {partnername}</p>
          </div>
          <div className="cook-stats">
            <div className="stat-box">
              <div className="stat-value">{partnerProfile?.zone ?? '—'}</div>
              <div className="stat-label">Zone</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {partnerProfile?.rating ?? '—'}
              </div>
              <div className="stat-label">⭐ Rating</div>
            </div>
            <div className="stat-box">
              <div className={`stat-box ${partnerProfile?.is_available ? 'status-online' : 'status-offline'}`}>
                <div className="stat-value">
                  {partnerProfile?.is_available ? 'Online' : 'Offline'}
                </div>
                <div className="stat-label">Status</div>
              </div>
            </div>
          </div>
        </div>

        {activeDelivery && (
          <div className="active-delivery-section">
            <h2>Current Delivery</h2>
            <div className="active-delivery-card">
              <div className="delivery-header">
                <div>
                  <div className="order-id-large">#{activeDelivery.id.slice(0, 8).toUpperCase()}</div>
                  <div className="customer-name-large">{activeDelivery.customer_name}</div>
                </div>
                <div className="delivery-amount">₹{activeDelivery.total}</div>
              </div>

              <div className="delivery-info-grid">
                <div className="info-item">
                  <div className="info-icon"><MapPin size={18} /></div>
                  <div>
                    <div className="info-label">Pickup</div>
                    <div className="info-value">Cook's Kitchen, {activeDelivery.zone}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><Navigation size={18} /></div>
                  <div>
                    <div className="info-label">Delivery</div>
                    <div className="info-value">{activeDelivery.address}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><Phone size={18} /></div>
                  <div>
                    <div className="info-label">Customer</div>
                    <div className="info-value">{activeDelivery.phone || '+91 XXXXX XXXXX'}</div>
                  </div>
                </div>
              </div>

              <div className="delivery-actions">
                <button className="btn-navigate" onClick={() => handleOpenMaps(activeDelivery)}>
                  <Navigation size={16} /> Open in Maps
                </button>
                <button className="btn-complete" onClick={handleCompleteDelivery}>
                  Mark as Delivered
                </button>
              </div>
            </div>
          </div>
        )}

        {!activeDelivery && (
          <div className="available-section">
            <h2>
              Available Orders
              {!loading && <span className="live-badge" title="Live updates on">● LIVE</span>}
            </h2>

            {loading && (
              <div className="empty-state">
                <Loader2 size={32} className="spin" />
                <p>Loading orders…</p>
              </div>
            )}

            {error && !loading && (
              <div className="empty-state error-state">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            {!loading && !error && availableOrders.length > 0 && (
              <div className="orders-grid">
                {availableOrders.map(order => (
                  <div key={order.id} className="delivery-card">
                    <div className="delivery-card-header">
                      <span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="zone-badge">{order.zone}</span>
                    </div>
                    <div className="delivery-card-body">
                      <div className="customer-name">{order.customer_name}</div>
                      <div className="order-items">{formatItems(order.items)}</div>
                      <div
                        className="delivery-distance"
                        onClick={() => handlePreviewPickup(order)}
                        style={{ cursor: 'pointer' }}
                        title="Preview pickup on Google Maps"
                      >
                        <MapPin size={14} /> ~2.3 km away
                      </div>
                    </div>
                    <div className="delivery-card-footer">
                      <div className="delivery-earning">
                        Earn ₹{Math.round(order.total * 0.15)}
                      </div>
                      <button
                        className="btn-accept-delivery"
                        onClick={() => handleAcceptDelivery(order)}
                        disabled={!partnerProfile}
                      >
                        Accept Delivery
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && availableOrders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>No orders available</h3>
                <p>New delivery requests will appear here automatically when orders are ready for pickup</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}