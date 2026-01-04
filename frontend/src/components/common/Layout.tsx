import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Extractable
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-slate-600 font-medium">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="px-4 py-2 text-sm font-medium bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
