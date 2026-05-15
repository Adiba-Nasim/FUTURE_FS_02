import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { mockMenuItems } from '../lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import heroBg from '../assets/mtt.jpg'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">Eco-Friendly Banana Leaf Packaging</div>
          <h1 className="hero-title">
            Real Home Cooking,<br />
            <em>Delivered to Your Door</em>
          </h1>
          <p className="hero-sub">
            Meals cooked with care by local women who pour their heart into every dish.
            Wholesome, affordable tiffins for students, working professionals, and elders who deserve a taste of home.
          </p>
          <div className="hero-actions">
            <Link to="/menu">
              <button className="btn-primary">Explore the Menu</button>
            </Link>
            <a href="#about">
              <button className="btn-outline">Our Story</button>
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-num">200+</div>
              <div className="hero-stat-label">Happy customers</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-num">30</div>
              <div className="hero-stat-label">Women empowered</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-num">0%</div>
              <div className="hero-stat-label">Plastic used</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="trust-item"><div className="trust-dot"></div> Made fresh daily by local mothers</div>
        <div className="trust-item"><div className="trust-dot"></div> No preservatives, no shortcuts</div>
        <div className="trust-item"><div className="trust-dot"></div> Delivered in 35 minutes or less</div>
        <div className="trust-item"><div className="trust-dot"></div> Zero plastic packaging</div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">As simple as ordering from home</h2>
        <p className="section-sub">We assign a nearby home cook to your order, just like how Blinkit assigns the closest partner — fast, local, and reliable.</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-title">Browse & Order</div>
            <div className="step-desc">Choose from our daily rotating menu of regional thalis, tiffins, and specials. Order once and taste the difference.</div>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-title">Matched to a Cook</div>
            <div className="step-desc">Our system matches your order to the nearest available home cook. You see her name, ratingand zone.</div>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-title">Delivered Fresh</div>
            <div className="step-desc">A local delivery partner picks up your tiffin, packed in banana leaf, and delivers it hot to your doorstep in under 45 minutes.</div>
          </div>
        </div>
      </section>

      {/* MENU PREVIEW */}
      <section className="menu-preview-section">
        <div className="section-label">Today's Menu</div>
        <h2 className="section-title">Fresh, regional, and made with love</h2>
  
        <div className="menu-preview-grid">
          {mockMenuItems.map((item) => (
            <div key={item.id} className="menu-preview-card">
              <div className="menu-preview-img-wrap">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="menu-preview-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="menu-preview-icon" style={{ display: 'none' }}>{item.emoji}</div>
              </div>
              <div className="menu-preview-name">{item.name}</div>
              <div className="menu-preview-desc">{item.desc || item.description}</div>
              <div className="menu-preview-price">₹{item.price}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/menu">
            <button className="btn-primary">View Full Menu</button>
          </Link>
        </div>
      </section>

      {/* EMPOWERMENT SECTION */}
      <section className="empower-section" id="about">
        <div className="empower-content">
          <div className="empower-left">
            <div className="empower-label">Our Mission</div>
            <h2 className="empower-title">Built on the strength of women who never had a stage</h2>
            <p className="empower-body">
              Mother's Touch Tiffin was born from a simple truth: some of the best food in India is cooked in homes that nobody knows about.
              Behind every tiffin is a woman — a mother, a widow, a survivor — who has spent years feeding her family with skill and care but never had the means to turn that gift into a livelihood.
            </p>
            <p className="empower-body">
              We give her that platform. A fair wage, flexible hours, training support, and a community of women who lift each other. When you order from us, you are not just getting a meal — you are funding a woman's independence.
            </p>
          </div>
          <div className="empower-right">
            <div className="empower-card">
              <div className="empower-icon">#</div>
              <div>
                <div className="empower-card-title">Zero-plastic packaging</div>
                <div className="empower-card-desc">Every order is packed in biodegradable banana leaf, threaded with nature. No styrofoam. No plastic. No compromise.</div>
              </div>
            </div>
            <div className="empower-card">
              <div className="empower-icon">#</div>
              <div>
                <div className="empower-card-title">Verified home cooks</div>
                <div className="empower-card-desc">Every cook on our platform is background-verified, hygiene-trained, and rated by real customers. Your safety, guaranteed.</div>
              </div>
            </div>
            <div className="empower-card">
              <div className="empower-icon">#</div>
              <div>
                <div className="empower-card-title">Fair-wage model</div>
                <div className="empower-card-desc">Cooks keep 78% of every order. We take only what's needed to keep the platform running. Transparent, always.</div>
              </div>
            </div>
            <div className="empower-card">
              <div className="empower-icon">#</div>
              <div>
                <div className="empower-card-title">Hyperlocal delivery</div>
                <div className="empower-card-desc">Delivery partners are assigned the same way Blinkit does it — closest partner first, reducing idle time and delivery distance.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <h2>Your next home-cooked meal<br />is 35 minutes away</h2>
        <p>Order whenever, get fresh hoemcooked meals and never worry about what to eat again. Nourishing meals. Real women. Zero plastic. One tap away.</p>
        <div className="cta-row">
          <Link to="/menu">
            <button className="btn-white">Order Your First Tiffin</button>
          </Link>
        </div>
      </section>

    <Footer id="contact" />  

      {/* WhatsApp Float */}
      <a href="https://wa.me/8521300000" className="whatsapp-float" target="_blank" rel="noopener noreferrer">
        <MessageCircle size={28} />
      </a>
    </div>
  )
}