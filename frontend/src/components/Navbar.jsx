import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, LogOut, LayoutDashboard, History, Building2 } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isVendor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
            <Users className="w-6 h-6" />
            <span>NoQueue</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/locations"
                  className="text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2 rounded-md hover:bg-slate-50 transition"
                >
                  Locations
                </Link>

                <Link
                  to="/history"
                  className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2 rounded-md hover:bg-slate-50 transition"
                >
                  <History className="w-4 h-4" />
                  <span>My History</span>
                </Link>

                {isVendor && (
                  <Link
                    to="/vendor/dashboard"
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-semibold px-3 py-2 rounded-md bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{isAdmin ? 'Admin Panel' : 'Vendor Desk'}</span>
                  </Link>
                )}

                <div className="h-6 w-px bg-slate-200" />

                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full capitalize">
                  {user.name} ({user.role})
                </span>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;