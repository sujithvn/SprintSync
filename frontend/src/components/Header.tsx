import React from 'react';
import { useAuth } from './AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-5">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
        <h1 className="text-2xl font-bold text-blue-600">SprintSync</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="font-medium">Welcome, {user.username}</span>
            {user.isAdmin && (
              <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Admin
              </span>
            )}
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
