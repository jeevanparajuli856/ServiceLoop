import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GlobalChatbot from './components/GlobalChatbot'
import Home from './pages/Home'
import Nonprofits from './pages/Nonprofits'
import NonprofitDetail from './pages/NonprofitDetail'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import MyOrganizations from './pages/MyOrganizations'
import MyOrganizationsAdmin from './pages/MyOrganizationsAdmin'
import OrganizationAdminPanel from './pages/OrganizationAdminPanel'
import Forum from './pages/Forum'
import PostDetail from './pages/PostDetail'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import SuperAdminRoute from './components/SuperAdminRoute'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nonprofits" element={<Nonprofits />} />
            <Route path="/nonprofits/:id" element={<NonprofitDetail />} />
            <Route 
              path="/org/:id/admin" 
              element={
                <ProtectedRoute>
                  <OrganizationAdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/my-organizations" element={<MyOrganizations />} />
            <Route 
              path="/my-organizations-admin" 
              element={
                <ProtectedRoute>
                  <MyOrganizationsAdmin />
                </ProtectedRoute>
              } 
            />
            <Route path="/forum" element={<Forum />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <SuperAdminRoute>
                  <AdminDashboard />
                </SuperAdminRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
        <GlobalChatbot />
      </div>
    </Router>
  )
}

export default App

