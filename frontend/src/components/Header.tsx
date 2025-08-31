import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 px-5">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
        <Link to="/tasks" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
          SprintSync
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <nav className="flex items-center gap-2">
              <Link
                to="/tasks"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/tasks'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Tasks
              </Link>
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>
            
            {/* User Info */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Welcome, {user.username}</span>
              {user.isAdmin && (
                <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Admin
                </span>
              )}
            </div>
            
            {/* Logout Button */}
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
