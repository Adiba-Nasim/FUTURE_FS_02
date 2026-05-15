import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Package, Plus, Trash2, LogOut, ChevronRight, Phone, Star, TrendingUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuthStore } from '../store/authStore'
import { fetchOrdersByUser } from '../lib/api'
import { supabase } from '../lib/supabase'
import { fetchCookProfile, fetchDeliveryPartnerProfile, fetchCookCompletedOrders, toggleCookAvailability } from '../lib/supabase'
import { ZONES } from '../utils/constants'
import { formatPrice } from '../utils/helpers'
import './Profile.css'

const STATUS_COLORS = {
  pending: { bg: '#fff8e6', text: '#c4891a' },
  preparing: { bg: '#fff0d4', text: '#b87020' },
  ready: { bg: '#e8f4fd', text: '#1a7abf' },
  dispatched: { bg: '#e8f4fd', text: '#1a7abf' },
  delivered: { bg: '#e6f9f0', text: '#1e9e5a' },
  cancelled: { bg: '#fdecea', text: '#c0392b' }
}

// ─── Star Rating Component ─────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="star-rating" style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer',
            padding: '2px', lineHeight: 1
          }}
        >
          <Star
            size={20}
            fill={(hovered || value) >= n ? '#d4a857' : 'none'}
            color={(hovered || value) >= n ? '#d4a857' : '#d0bfa0'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Rating Modal ──────────────────────────────────────────────────────────
function RatingModal({ order, onClose, onSubmit }) {
  const [cookRating, setCookRating] = useState(0)
  const [deliveryRating, setDeliveryRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!cookRating && !deliveryRating) return
    setSubmitting(true)
    await onSubmit(order, cookRating, deliveryRating)
    setSubmitting(false)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '400px',
          width: '100%', boxShadow: '0 8px 40px rgba(44,26,14,0.18)',
          border: '1px solid #f0e8d4'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#2c1a0e', fontWeight: 700 }}>
          Rate your order
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#9c7c4a' }}>
          Order #{String(order.id).slice(0, 8).toUpperCase()}
        </p>

        {order.cook_id && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#7a5a2a', marginBottom: '8px' }}>
              Rate the Cook
            </div>
            <StarRating value={cookRating} onChange={setCookRating} />
          </div>
        )}

        {order.delivery_partner_id && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#7a5a2a', marginBottom: '8px' }}>
               Rate the Delivery Partner
            </div>
            <StarRating value={deliveryRating} onChange={setDeliveryRating} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary-btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button
            className="primary-btn"
            onClick={handleSubmit}
            disabled={submitting || (!cookRating && !deliveryRating)}
            style={{ flex: 1 }}
          >
            {submitting ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Worker Profile (Cook / Delivery) ─────────────────────────────────────
function WorkerProfile({ user, role, profile, onSignOut }) {
  const name = user?.user_metadata?.name || 'User'
  const email = user?.email || ''
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const [tab, setTab] = useState('info')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [available, setAvailable] = useState(profile?.is_available || false)
  const [togglingAvail, setTogglingAvail] = useState(false)

  useEffect(() => {
    setAvailable(profile?.is_available || false)
  }, [profile?.is_available])

  const handleToggleAvailable = async () => {
    if (!profile?.id || role !== 'cook') return
    setTogglingAvail(true)
    try {
      await toggleCookAvailability(profile.id, !available)
      setAvailable(prev => !prev)
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingAvail(false)
    }
  }

  useEffect(() => {
    if (tab !== 'history' || !profile?.id) return
    setLoadingHistory(true)

    const fetchHistory = async () => {
      try {
        if (role === 'cook') {
          const data = await fetchCookCompletedOrders(profile.id)
          setHistory(data || [])
        } else if (role === 'delivery') {
          const { data } = await supabase
            .from('orders')
            .select('id, customer_name, items, total, status, created_at, zone')
            .eq('delivery_partner_id', profile.id)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })
          setHistory(data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchHistory()
  }, [tab, profile?.id, role])

  const infoRows = role === 'cook'
    ? [
      { icon: <Phone size={16} />, label: 'Phone', value: profile?.phone || '—' },
      { icon: <MapPin size={16} />, label: 'Zone', value: profile?.zone || '—' },
      { icon: <Star size={16} />, label: 'Rating', value: profile?.rating ?? '—' },
      { icon: <TrendingUp size={16} />, label: 'Total Orders', value: profile?.total_orders ?? '—' },
      { icon: <Clock size={16} />,       label: 'Available',    value: (
          <button
            onClick={handleToggleAvailable}
            disabled={togglingAvail}
            style={{
              padding: '4px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '13px', transition: 'all 0.2s ease',
              background: available ? '#e6f9f0' : '#fdecea',
              color: available ? '#1e9e5a' : '#c0392b',
              opacity: togglingAvail ? 0.6 : 1
            }}
          >
            {togglingAvail ? '...' : available ? 'Available' : 'Unavailable'}
          </button>
        )},
    ]
    : [
      { icon: <Phone size={16} />, label: 'Email', value: email },
      { icon: <Phone size={16} />, label: 'Phone', value: profile?.phone || '—' },
      { icon: <MapPin size={16} />, label: 'Zone', value: profile?.zone || '—' },
      { icon: <Clock size={16} />, label: 'Status', value: profile?.is_available ? 'Online' : 'Offline' },
    ]

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">

        <div className="profile-header-card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h1 className="profile-name">{name}</h1>
            <p className="profile-email">{role === 'cook' ? ' Home Cook' : ' Delivery Partner'}</p>
          </div>
          <button className="signout-btn" onClick={onSignOut}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
            <Phone size={16} /> My Info
          </button>
          <button className={`profile-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <Package size={16} /> Order History
          </button>
        </div>

        <div className="tab-content">
          {tab === 'info' && (
            <div className="worker-info-list">
              {infoRows.map((row, i) => (
                <div key={i} className="worker-info-row">
                  <div className="worker-info-icon">{row.icon}</div>
                  <div className="worker-info-label">{row.label}</div>
                  <div className="worker-info-value">{row.value}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <>
              {loadingHistory ? (
                <div className="loading-state">Loading history…</div>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <Package size={40} strokeWidth={1.2} />
                  <h3>No completed orders yet</h3>
                  <p>Orders you've completed will appear here</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9c7c4a', fontWeight: 600 }}>
                    {history.length} completed order{history.length !== 1 ? 's' : ''}
                  </p>
                 {history.map(order => (
                    <div key={order.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', background: '#faf6ef',
                      border: '1.5px solid #f0e8d4', borderRadius: '12px', gap: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#2c1a0e' }}>
                          Order #{String(order.id).slice(0, 8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '12px', color: '#5a3a1a', fontWeight: 500 }}>
                          {(order.items || []).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9c7c4a' }}>
                          {order.customer_name} · {order.zone}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9c7c4a' }}>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#c4891a' }}>₹{order.total}</div>
                        <div style={{
                          marginTop: '4px', fontSize: '11px', fontWeight: 700,
                          padding: '3px 10px', borderRadius: '20px',
                          background: '#e6f9f0', color: '#1e9e5a'
                        }}>Delivered</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
      <Footer />
    </div>
  )
}

// ─── Main Profile (Customer) ───────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate()
  const { user, role, signOut, refreshUser } = useAuthStore()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [addresses, setAddresses] = useState(user?.user_metadata?.saved_addresses || [])
  const [addingAddress, setAddingAddress] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: '', full_address: '', zone: ZONES[0] })
  const [savingAddr, setSavingAddr] = useState(false)
  const [workerProfile, setWorkerProfile] = useState(null)
  const [ratingOrder, setRatingOrder] = useState(null)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user])

  useEffect(() => {
    setAddresses(user?.user_metadata?.saved_addresses || [])
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    if (role === 'cook') {
      fetchCookProfile(user.id).then(setWorkerProfile).catch(() => { })
    } else if (role === 'delivery') {
      fetchDeliveryPartnerProfile(user.id).then(setWorkerProfile).catch(() => { })
    }
  }, [user?.id, role])

  useEffect(() => {
    if (!user?.id || role !== 'customer') return
    setLoadingOrders(true)
    fetchOrdersByUser(user.id)
      .then(data => setOrders(data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false))
  }, [user?.id])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleAddAddress = async () => {
    if (!newAddr.full_address.trim()) return
    setSavingAddr(true)
    const updated = [...addresses, { ...newAddr, label: newAddr.label || 'Home' }]
    try {
      const { error } = await supabase.auth.updateUser({ data: { saved_addresses: updated } })
      if (error) throw error
      await refreshUser()
      setNewAddr({ label: '', full_address: '', zone: ZONES[0] })
      setAddingAddress(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingAddr(false)
    }
  }

  const handleRemoveAddress = async (index) => {
    const updated = addresses.filter((_, i) => i !== index)
    const { error } = await supabase.auth.updateUser({ data: { saved_addresses: updated } })
    if (!error) await refreshUser()
  }

  // ── Submit ratings and update cook/delivery partner averages
  const handleSubmitRating = async (order, cookRating, deliveryRating) => {
    try {
      await supabase.from('orders').update({
        ...(cookRating ? { cook_rating: cookRating } : {}),
        ...(deliveryRating ? { delivery_rating: deliveryRating } : {})
      }).eq('id', order.id)

      if (cookRating && order.cook_id) {
        const { data: allRatings } = await supabase
          .from('orders')
          .select('cook_rating')
          .eq('cook_id', order.cook_id)
          .not('cook_rating', 'is', null)
        const ratings = [...(allRatings || []).map(o => o.cook_rating), cookRating]
        const avg = (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
        await supabase.from('cooks').update({ rating: avg }).eq('id', order.cook_id)
      }

      if (deliveryRating && order.delivery_partner_id) {
        const { data: allRatings } = await supabase
          .from('orders')
          .select('delivery_rating')
          .eq('delivery_partner_id', order.delivery_partner_id)
          .not('delivery_rating', 'is', null)
        const ratings = [...(allRatings || []).map(o => o.delivery_rating), deliveryRating]
        const avg = (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
        await supabase.from('delivery_partners').update({ rating: avg }).eq('id', order.delivery_partner_id)
      }

      setOrders(prev => prev.map(o => o.id === order.id
        ? { ...o, cook_rating: cookRating || o.cook_rating, delivery_rating: deliveryRating || o.delivery_rating }
        : o
      ))
    } catch (err) {
      console.error('Rating failed:', err)
    }
  }
  // ── Cooks and delivery partners see their own info + history
  if (role === 'cook' || role === 'delivery') {
    return (
      <WorkerProfile
        user={user}
        role={role}
        profile={workerProfile}
        onSignOut={handleSignOut}
      />
    )
  }

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">

        <div className="profile-header-card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h1 className="profile-name">{name}</h1>
            <p className="profile-email">{email}</p>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            <Package size={16} /> Order History
          </button>
          <button className={`profile-tab ${tab === 'addresses' ? 'active' : ''}`} onClick={() => setTab('addresses')}>
            <MapPin size={16} /> Saved Addresses
          </button>
        </div>

        {tab === 'orders' && (
          <div className="tab-content">
            {loadingOrders ? (
              <div className="loading-state">Loading your orders...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <Package size={40} strokeWidth={1.2} />
                <h3>No orders yet</h3>
                <p>Your past orders will appear here</p>
                <button className="primary-btn" onClick={() => navigate('/menu')}>Browse Menu</button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order, i) => {
                  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
                  const isDelivered = order.status === 'delivered'
                  const alreadyRated = order.cook_rating || order.delivery_rating
                  return (
                    <div key={order.id || i} className="order-card"
                      onClick={() => navigate(`/order/${order.id}`)}
                      role="button" tabIndex={0}
                    >
                      <div className="order-card-top">
                        <div>
                          <div className="order-card-id">Order #{order.id}</div>
                          <div className="order-card-date">
                            <Clock size={12} />
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })
                              : 'Recent'}
                          </div>
                        </div>
                        <span className="status-badge" style={{ background: sc.bg, color: sc.text }}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-card-items">
                        {(order.items || []).slice(0, 3).map((item, j) => (
                          <span key={j} className="order-item-pill">{item.name} ×{item.quantity}</span>
                        ))}
                        {(order.items || []).length > 3 && (
                          <span className="order-item-pill more">+{order.items.length - 3} more</span>
                        )}
                      </div>

                      <div className="order-card-bottom">
                        <span className="order-card-total">{formatPrice(order.total)}</span>

                        {isDelivered && !alreadyRated ? (
                          <button
                            className="rate-btn"
                            onClick={e => { e.stopPropagation(); setRatingOrder(order) }}
                          >
                            <Star size={14} /> Rate Order
                          </button>
                        ) : isDelivered && alreadyRated ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={13} fill="#d4a857" color="#d4a857" />
                            <span style={{ fontSize: '12px', color: '#9c7c4a', fontWeight: 600 }}>Rated</span>
                          </div>
                        ) : (
                          <span className="order-card-link">
                            Track order <ChevronRight size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'addresses' && (
          <div className="tab-content">
            <div className="addresses-list">
              {addresses.map((addr, i) => (
                <div key={i} className="addr-card">
                  <div className="addr-icon"><MapPin size={18} /></div>
                  <div className="addr-body">
                    <div className="addr-label-text">{addr.label}</div>
                    <div className="addr-full-text">{addr.full_address}</div>
                    <div className="addr-zone-tag">{addr.zone}</div>
                  </div>
                  <button className="addr-remove-btn" onClick={() => handleRemoveAddress(i)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {addingAddress ? (
              <div className="add-addr-form">
                <h3>Add New Address</h3>
                <div className="form-group">
                  <label>Label (e.g. Home, Work)</label>
                  <input value={newAddr.label}
                    onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))}
                    placeholder="Home" />
                </div>
                <div className="form-group">
                  <label>Full Address *</label>
                  <textarea value={newAddr.full_address}
                    onChange={e => setNewAddr(p => ({ ...p, full_address: e.target.value }))}
                    placeholder="House no., Street, Area..." rows={3} />
                </div>
                <div className="form-group">
                  <label>Zone</label>
                  <select value={newAddr.zone} onChange={e => setNewAddr(p => ({ ...p, zone: e.target.value }))}>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="addr-form-btns">
                  <button className="secondary-btn" onClick={() => setAddingAddress(false)}>Cancel</button>
                  <button className="primary-btn" onClick={handleAddAddress} disabled={savingAddr}>
                    {savingAddr ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-addr-btn" onClick={() => setAddingAddress(true)}>
                <Plus size={16} /> Add New Address
              </button>
            )}
          </div>
        )}

      </div>
      <Footer />

      {ratingOrder && (
        <RatingModal
          order={ratingOrder}
          onClose={() => setRatingOrder(null)}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  )
}