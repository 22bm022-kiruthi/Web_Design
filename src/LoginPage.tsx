import React, { useState } from 'react';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col items-center bg-white rounded-lg shadow-lg p-8 w-96">
        {/* Company Logo */}
        <img src="/logo.png" alt="Company Logo" className="h-20 mb-4" />
        {/* Company Name */}
        <h1 className="text-3xl font-bold mb-2 text-blue-700">Your Company Name</h1>
        {/* Welcome Message */}
        <p className="mb-6 text-gray-600">Welcome! Please log in to continue.</p>
        {/* Username Input */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="mb-4 px-4 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-6 px-4 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* Login Button */}
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 w-full font-semibold"
          onClick={onLogin}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
