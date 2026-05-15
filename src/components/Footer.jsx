import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer({ id }) {
  return (
     <footer className="footer" id={id}>
      <div className="footer-grid">
        <div>
          <div className="footer-brand-name">Mother's Touch Tiffin</div>
          <div className="footer-brand-tagline">
            Homemade food delivered by women who care, packed in banana leaf, priced for everyone.
          </div>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">-Menu-</div>
          <Link to="/menu">Full Thali</Link>
          <Link to="/menu">Comfort Tiffin</Link>
          <Link to="/menu">Non-Veg Special</Link>
          <Link to="/menu">Senior Care</Link>
          <Link to="/menu">Student Saver</Link>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">-Company-</div>
         <Link to="/#about" onClick={(e) => {
          if (window.location.pathname === '/') {
            e.preventDefault()
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
          }
        }}>Our Story</Link>
          <Link to="/login">Join as a Delivery Partners</Link>
          <Link to="/login">Join as a Cook</Link>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">-Contact-</div>
          <a href="https://wa.me/8521300000">WhatsApp Chat</a>
          <a href="mailto:hello@motherstouchtiffin.com">Mail Us</a>
          <Link to="/menu">Subscription Plans--To Be Added Soon :)</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <div>&copy; 2025 Mother's Touch Tiffin. All rights reserved.</div>
      </div>
    </footer>
  )
}