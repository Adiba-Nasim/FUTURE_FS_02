import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, User, Menu, X } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const items = useCartStore(state => state.items)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const { user, role, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const handleScrollLink = (e, sectionId) => {
    e.preventDefault()
    setMenuOpen(false)
    if (window.location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }

  const dashboardPath =
    role === 'cook' ? '/cook/dashboard' :
    role === 'delivery' ? '/delivery/dashboard' :
    '/admin'

  return (
    <>
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
          <a href="#how-it-works" onClick={(e) => handleScrollLink(e, 'how-it-works')}>How it Works</a>
          <a href="#about" onClick={(e) => handleScrollLink(e, 'about')}>Our Story</a>
          <a href="#footer" onClick={(e) => handleScrollLink(e, 'footer')}>Contact</a>
          {(role === 'cook' || role === 'delivery' || role === 'admin') && (
            <Link to={dashboardPath}>Dashboard</Link>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="nav-user">
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

          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — sits outside <nav> so it drops below it */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <Link to="/menu" onClick={() => setMenuOpen(false)}>Menu</Link>
        <a href="#how-it-works" onClick={(e) => handleScrollLink(e, 'how-it-works')}>How it Works</a>
        <a href="#about" onClick={(e) => handleScrollLink(e, 'about')}>Our Story</a>
        <a href="#footer" onClick={(e) => handleScrollLink(e, 'footer')}>Contact</a>
        {(role === 'cook' || role === 'delivery' || role === 'admin') && (
          <Link to={dashboardPath} onClick={() => setMenuOpen(false)}>Dashboard</Link>
        )}
        <div className="mobile-menu-actions">
          {user ? (
            <>
              <Link to="/profile" className="nav-cta" onClick={() => setMenuOpen(false)}>
                My Profile
              </Link>
              <button className="nav-signout" onClick={handleSignOut} title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-cta" onClick={() => setMenuOpen(false)}>
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </>
  )
}