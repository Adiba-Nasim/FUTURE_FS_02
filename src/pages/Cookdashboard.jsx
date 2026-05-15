import { useState, useEffect } from 'react'
import { Check, X, Clock, Loader2, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/authStore'
import './Cookdashboard.css'
import {
  fetchCookOrders,
  fetchCookProfile,
  acceptCookOrder,
  rejectCookOrder,
  markOrderReady,
  subscribeToCookOrders,
  fetchCookCompletedOrders,
  toggleCookAvailability
} from '../lib/supabase'

export default function CookDashboard() {
  const [orders, setOrders] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])
  const [cook, setCook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('active')
  const { user } = useAuthStore()

  const cookname = cook?.name || user?.user_metadata?.name || 'Cook'

  const formatItems = (items) => {
    if (!items) return '—'
    if (typeof items === 'string') return items
    if (Array.isArray(items)) return items.map(i => `${i.name} x${i.quantity}`).join(', ')
    return JSON.stringify(items)
  }

  const shortId = (id) => `#${String(id).slice(0, 8).toUpperCase()}`
  const formatDate = (ts) => ts
    ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  useEffect(() => {
    if (!user?.id) return
    let channel

    async function init() {
      try {
        setLoading(true)
        setError(null)

        const cookProfile = await fetchCookProfile(user.id)
        setCook(cookProfile)

        if (!cookProfile) {
          setLoading(false)
          return
        }

        const [cookOrders, done] = await Promise.all([
          cookProfile.is_available
            ? fetchCookOrders(cookProfile.id, cookProfile.zone)  // ← pass zone
            : Promise.resolve([]),
          fetchCookCompletedOrders(cookProfile.id)
        ])

        setOrders(cookOrders)
        setCompletedOrders(done)
        setCook(prev => ({ ...prev, total_orders: cookOrders.length + done.length }))

        // Subscribe on zone, not cook_id
        channel = subscribeToCookOrders(cookProfile.id, cookProfile.zone, {
          onOrderNew: (newOrder) => {
            setOrders(prev => prev.some(o => o.id === newOrder.id) ? prev : [newOrder, ...prev])
          },
          onOrderUpdated: (updatedOrder) => {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
          },
          onOrderRemoved: (orderId) => {
            setOrders(prev => {
              const found = prev.find(o => o.id === orderId)
              if (found?.status === 'delivered') setCompletedOrders(c => [found, ...c])
              return prev.filter(o => o.id !== orderId)
            })
          }
        })
      } catch (err) {
        console.error('Failed to load cook dashboard:', err)
        setError('Could not load orders. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    init()
    return () => { channel?.unsubscribe() }
  }, [user?.id])

  const handleAccept = async (orderId) => {
  setOrders(prev => prev.map(o =>
    o.id === orderId ? { ...o, status: 'preparing', cook_id: cook.id } : o
  ))
  try {
    await acceptCookOrder(orderId, cook.id)
    console.log('accepted')
  } catch (err) {
    console.error(' acceptCookOrder failed:', err)
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'pending', cook_id: null } : o
    ))
  }
}

  const handleReject = async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const handleMarkReady = async (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o))
    try { await markOrderReady(orderId) }
    catch (err) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o)) }
  }

  const handleToggleAvailable = async () => {
    if (!cook?.id) return
    const newAvailability = !cook.is_available
    try {
      await toggleCookAvailability(cook.id, newAvailability)
      setCook(prev => ({ ...prev, is_available: newAvailability }))

      if (newAvailability) {
        // Just came online — fetch zone pool orders
        const cookOrders = await fetchCookOrders(cook.id, cook.zone)
        setOrders(cookOrders)
      } else {
        // Went offline — clear list
        setOrders([])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const activeOrders = orders.filter(o => o.status === 'preparing' && o.cook_id === cook?.id)
  const readyOrders = orders.filter(o => o.status === 'ready' && o.cook_id === cook?.id)

  return (
    <div className="cook-dashboard">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Cook Dashboard</h1>
            <p className="welcome-text">Welcome back, {cookname}</p>
          </div>
          <div className="cook-stats">
            <div className="stat-box">
              <div className="stat-value">{cook?.rating ?? '—'}</div>
              <div className="stat-label">Rating⭐</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{cook?.total_orders ?? '—'}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{cook?.zone ?? '—'}</div>
              <div className="stat-label">Zone</div>
            </div>
            <button
              onClick={handleToggleAvailable}
              style={{
                padding: '8px 18px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                background: cook?.is_available ? '#e6f9f0' : '#fdecea',
                color: cook?.is_available ? '#1e9e5a' : '#c0392b',
                alignSelf: 'center'
              }}
            >
              {cook?.is_available ? '🟢 Available' : '🔴 Unavailable'}
            </button>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button className={`dashboard-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            Active Orders
            {orders.length > 0 && <span className="tab-badge">{orders.length}</span>}
          </button>
          <button className={`dashboard-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            Order History
            {completedOrders.length > 0 && <span className="tab-badge muted">{completedOrders.length}</span>}
          </button>
        </div>

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

        {!loading && !error && tab === 'active' && (
          <>
            {pendingOrders.length > 0 && (
              <div className="orders-section">
                <h2>New Orders — {cook?.zone} Zone</h2>
                <div className="orders-grid">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="order-card pending">
                      <div className="order-card-header">
                        <span className="order-id">{shortId(order.id)}</span>
                        <span className="order-status-badge pending">New</span>
                      </div>
                      <div className="order-details">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="order-items-text">{formatItems(order.items)}</div>
                        <div className="order-meta">
                          <span className="order-zone">📍 {order.zone}</span>
                          <span className="order-amount">₹{order.total}</span>
                        </div>
                        <div className="order-date">{formatDate(order.created_at)}</div>
                      </div>
                      <div className="order-actions">
                        <button className="btn-accept" onClick={() => handleAccept(order.id)}>
                          <Check size={16} /> Accept
                        </button>
                        <button className="btn-reject" onClick={() => handleReject(order.id)}>
                          <X size={16} /> Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeOrders.length > 0 && (
              <div className="orders-section">
                <h2>Preparing</h2>
                <div className="orders-grid">
                  {activeOrders.map(order => (
                    <div key={order.id} className="order-card active">
                      <div className="order-card-header">
                        <span className="order-id">{shortId(order.id)}</span>
                        <span className="order-status-badge active">Preparing</span>
                      </div>
                      <div className="order-details">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="order-items-text">{formatItems(order.items)}</div>
                        <div className="order-meta">
                          <span className="order-zone">📍 {order.zone}</span>
                          <span className="order-amount">₹{order.total}</span>
                        </div>
                        <div className="order-date">{formatDate(order.created_at)}</div>
                      </div>
                      <div className="order-actions">
                        <button className="btn-mark-ready" onClick={() => handleMarkReady(order.id)}>
                          <Check size={16} /> Mark Ready
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {readyOrders.length > 0 && (
              <div className="orders-section">
                <h2>Ready for Pickup</h2>
                <div className="orders-grid">
                  {readyOrders.map(order => (
                    <div key={order.id} className="order-card ready">
                      <div className="order-card-header">
                        <span className="order-id">{shortId(order.id)}</span>
                        <span className="order-status-badge ready">Ready</span>
                      </div>
                      <div className="order-details">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="order-items-text">{formatItems(order.items)}</div>
                        <div className="order-meta">
                          <span className="order-zone">📍 {order.zone}</span>
                          <span className="order-amount">₹{order.total}</span>
                        </div>
                        <div className="order-date">{formatDate(order.created_at)}</div>
                      </div>
                      <div className="waiting-pickup">
                        <Clock size={16} /> Waiting for delivery partner
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">...</div>
                <h3>No active orders</h3>
                <p>New orders in {cook?.zone ?? 'your zone'} will appear here automatically</p>
              </div>
            )}
          </>
        )}

        {!loading && !error && tab === 'history' && (
          <>
            {completedOrders.length === 0 ? (
              <div className="empty-state">
                <Package size={36} strokeWidth={1.2} />
                <h3>No completed orders yet</h3>
                <p>Orders you've delivered will appear here</p>
              </div>
            ) : (
              <div className="orders-section">
                <h2>Completed Orders ({completedOrders.length})</h2>
                <div className="orders-grid">
                  {completedOrders.map(order => (
                    <div key={order.id} className="order-card delivered">
                      <div className="order-card-header">
                        <span className="order-id">{shortId(order.id)}</span>
                        <span className="order-status-badge delivered">Delivered</span>
                      </div>
                      <div className="order-details">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="order-items-text">{formatItems(order.items)}</div>
                        <div className="order-meta">
                          <span className="order-zone">📍 {order.zone}</span>
                          <span className="order-amount">₹{order.total}</span>
                        </div>
                        <div className="order-date">{formatDate(order.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}