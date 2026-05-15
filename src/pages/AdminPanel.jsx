import { useState, useEffect } from 'react'
import { Users, TrendingUp, DollarSign, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import './AdminPanel.css'
import { supabase } from '../lib/supabase'
import { ZONES } from '../utils/constants'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [cooks, setCooks] = useState([])
  const [orders, setOrders] = useState([])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)

  // filters
  const [cookZone, setCookZone] = useState('')
  const [partnerZone, setPartnerZone] = useState('')
  const [orderZone, setOrderZone] = useState('')
  const [orderStatus, setOrderStatus] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [
        { data: cooksData },
        { data: ordersData },
        { data: partnersData },
      ] = await Promise.all([
        supabase.from('cooks').select('*').order('rating', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_partners').select('*').order('name'),
      ])

      const fetchedOrders = ordersData ?? []
      const fetchedPartners = partnersData ?? []

      // Compute total_orders per partner from orders table (fixes the 0 bug)
      const orderCountMap = {}
      fetchedOrders.forEach(o => {
        if (o.delivery_partner_id) {
          orderCountMap[o.delivery_partner_id] = (orderCountMap[o.delivery_partner_id] || 0) + 1
        }
      })
      const partnersWithCount = fetchedPartners.map(p => ({
        ...p,
        computed_total_orders: orderCountMap[p.id] ?? 0
      }))

      setCooks(cooksData ?? [])
      setOrders(fetchedOrders)
      setPartners(partnersWithCount)
      setLoading(false)
    }
    loadData()
  }, [])

  // Build a lookup map: delivery_partner_id (int) → partner name
  const partnerMap = {}
  partners.forEach(p => { partnerMap[p.id] = p.name })

  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const avgRating = cooks.length
    ? (cooks.reduce((sum, c) => sum + (c.rating || 0), 0) / cooks.length).toFixed(1)
    : '—'

  const filteredCooks    = cookZone    ? cooks.filter(c => c.zone === cookZone)       : cooks
  const filteredPartners = partnerZone ? partners.filter(p => p.zone === partnerZone) : partners
  const filteredOrders   = orders
    .filter(o => orderZone   ? o.zone   === orderZone   : true)
    .filter(o => orderStatus ? o.status === orderStatus : true)

  const tabs = ['overview', 'cooks', 'delivery', 'orders']

  return (
    <div className="admin-panel">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage your tiffin delivery platform</p>
        </div>

        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'var(--saffron-pale)', color: 'var(--saffron)' }}>
              <Package size={24} />
            </div>
            <div>
              <div className="stats-value">{orders.length}</div>
              <div className="stats-label">Total Orders</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'var(--green-pale)', color: 'var(--green)' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stats-value">{cooks.filter(c => c.is_available).length}</div>
              <div className="stats-label">Active Cooks</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div className="stats-value">₹{(revenue / 1000).toFixed(1)}k</div>
              <div className="stats-label">Total Revenue</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: '#fff3e0', color: '#f57c00' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="stats-value">{avgRating}</div>
              <div className="stats-label">Avg Rating</div>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          {tabs.map(t => (
            <button key={t} className={activeTab === t ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab(t)}>
              {t === 'delivery' ? 'Delivery Partners' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-content">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="overview-content">
              <h2>Platform Overview</h2>
              <p>{loading ? 'Loading...' : `${orders.length} total orders · ${cooks.length} cooks · ${partners.length} delivery partners`}</p>
              <div className="chart-placeholder">
                <div className="chart-icon">📊</div>
                <p>Revenue Chart Placeholder</p>
                <small>Integrate Chart.js or Recharts for detailed analytics</small>
              </div>
            </div>
          )}

          {/* COOKS */}
          {activeTab === 'cooks' && (
            <div className="cooks-content">
              <div className="section-header">
                <h2>Registered Cooks ({filteredCooks.length})</h2>
                <select className="filter-select" value={cookZone} onChange={e => setCookZone(e.target.value)}>
                  <option value="">All Zones</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Zone</th><th>Phone</th>
                      <th>Rating</th><th>Total Orders</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? <tr><td colSpan={6}>Loading...</td></tr>
                      : filteredCooks.length === 0
                        ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No cooks in this zone</td></tr>
                        : filteredCooks.map(cook => (
                          <tr key={cook.id}>
                            <td className="cook-name-cell">{cook.name}</td>
                            <td>{cook.zone}</td>
                            <td>{cook.phone || '—'}</td>
                            <td>⭐ {cook.rating ?? '—'}</td>
                            <td>{cook.total_orders ?? 0}</td>
                            <td>
                              <span className={cook.is_available ? 'status-badge active' : 'status-badge inactive'}>
                                {cook.is_available ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DELIVERY PARTNERS */}
          {activeTab === 'delivery' && (
            <div className="cooks-content">
              <div className="section-header">
                <h2>Delivery Partners ({filteredPartners.length})</h2>
                <select className="filter-select" value={partnerZone} onChange={e => setPartnerZone(e.target.value)}>
                  <option value="">All Zones</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Zone</th><th>Phone</th>
                      <th>Rating</th><th>Total Orders</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? <tr><td colSpan={6}>Loading...</td></tr>
                      : filteredPartners.length === 0
                        ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No delivery partners in this zone</td></tr>
                        : filteredPartners.map(p => (
                          <tr key={p.id}>
                            <td className="cook-name-cell">{p.name}</td>
                            <td>{p.zone}</td>
                            <td>{p.phone || '—'}</td>
                            <td>⭐ {p.rating ?? '—'}</td>
                            {/* Uses computed count from orders table, not the stale DB column */}
                            <td>{p.computed_total_orders}</td>
                            <td>
                              <span className={p.is_available ? 'status-badge active' : 'status-badge inactive'}>
                                {p.is_available ? 'Online' : 'Offline'}
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="orders-content">
              <div className="section-header">
                <h2>Orders ({filteredOrders.length})</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="filter-select" value={orderZone} onChange={e => setOrderZone(e.target.value)}>
                    <option value="">All Zones</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <select className="filter-select" value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {['pending', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Zone</th>
                      <th>Amount</th>
                      <th>Status</th>
                      {/* NEW COLUMN */}
                      <th>Delivered By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? <tr><td colSpan={7}>Loading...</td></tr>
                      : filteredOrders.length === 0
                        ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders found</td></tr>
                        : filteredOrders.map(order => (
                          <tr key={order.id}>
                            <td className="order-id-cell">#{String(order.id).slice(0, 8).toUpperCase()}</td>
                            <td>{order.customer_name}</td>
                            <td>{order.zone}</td>
                            <td className="amount-cell">₹{order.total}</td>
                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                            {/* Lookup partner name from partnerMap using delivery_partner_id */}
                            <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                              {order.delivery_partner_id
                                ? (partnerMap[order.delivery_partner_id] ?? <span style={{ color: 'var(--text-muted)' }}>Unknown</span>)
                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                              }
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}