import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Order from './pages/Order'
import Profile from './pages/Profile'
import Cookdashboard from './pages/Cookdashboard'
import Deliverydashboard from './pages/Deliverydashboard'
import AdminPanel from './pages/AdminPanel'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />

        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />

        {/* /checkout → checkout form (no :id, so useParams gives undefined) */}
        <Route path="/checkout" element={<Order />} />

        {/* /order/:id → tracking page only, reached after order placed */}
        <Route path="/order/:id" element={<Order />} />

        {/* User profile */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['customer', 'cook', 'delivery', 'admin']}>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/cook/dashboard" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookDashboard />
          </ProtectedRoute>
        } />

        <Route path="/delivery/dashboard" element={
          <ProtectedRoute allowedRoles={['delivery']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App