import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GlobalChatbot from './components/GlobalChatbot'
import Home from './pages/Home'
import Nonprofits from './pages/Nonprofits'
import NonprofitDetail from './pages/NonprofitDetail'
import Events from './pages/Events'
import MyOrganizations from './pages/MyOrganizations'
import Forum from './pages/Forum'
import PostDetail from './pages/PostDetail'
import Login from './pages/Login'

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
            <Route path="/events" element={<Events />} />
            <Route path="/my-organizations" element={<MyOrganizations />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        <Footer />
        <GlobalChatbot />
      </div>
    </Router>
  )
}

export default App

