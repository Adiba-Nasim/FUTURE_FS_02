import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, User } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()
  const items = useCartStore(state => state.items)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const { user, role, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-logo-icon">M</div>
        <div className="nav-logo-text">
          Mother's Touch Tiffin
          <span>Homemade. Wholesome. Delivered.</span>
        </div>
      </Link>

      <div className="nav-links">
        <Link to="/menu">Menu</Link>
        <Link to="/#how-it-works" onClick={(e) => {
          if (window.location.pathname === '/') {
            e.preventDefault()
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
          }
        }}>How it Works</Link>
        <Link to="/#about" onClick={(e) => {
          if (window.location.pathname === '/') {
            e.preventDefault()
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
          }
        }}>Our Story</Link>
        <Link to="/footer" onClick={(e) => {
          if (window.location.pathname === '/') {
            e.preventDefault()
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
          }
        }}>Contact</Link>
        {(role === 'cook' || role === 'delivery' || role === 'admin') && (
          <Link to={
            role === 'cook' ? '/cook/dashboard' :
            role === 'delivery' ? '/delivery/dashboard' :
            '/admin'
          }>Dashboard</Link>
        )}
      </div>

      <div className="nav-actions">
        {user ? (
          <div className="nav-user">
            {/* Profile link — visible to all logged-in users */}
            <Link to="/profile" className="nav-profile-link" title="My Profile">
              <User size={16} />
              <span className="nav-username">
                {user.user_metadata?.name?.split(' ')[0] || 'Account'}
              </span>
            </Link>
            <button className="nav-signout" onClick={handleSignOut} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-cta">Login / Sign Up</Link>
        )}

        <Link to={totalItems > 0 ? '/order/checkout' : '/menu'} className="nav-cart">
          <ShoppingCart size={20} />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </Link>
      </div>
    </nav>
  )
}