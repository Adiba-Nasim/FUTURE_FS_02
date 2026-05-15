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
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Order />} />
        <Route path="/order/:id" element={<Order />} />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['customer', 'cook', 'delivery', 'admin']}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/cook/dashboard" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <Cookdashboard />
          </ProtectedRoute>
        } />
        <Route path="/delivery/dashboard" element={
          <ProtectedRoute allowedRoles={['delivery']}>
            <Deliverydashboard />
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