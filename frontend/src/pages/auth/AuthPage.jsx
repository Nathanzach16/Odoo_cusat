import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const endpoint = isLogin ? 'http://127.0.0.1:8000/auth/login' : 'http://127.0.0.1:8000/auth/signup';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        // Save auth context in localStorage
        localStorage.setItem('token', 'authenticated_user_session'); 
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);

        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          if (data.role === 'ADMIN') {
            navigate('/admin/staff');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setMessage(data.message);
        setIsLogin(true); // Switch to login view after successful signup
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded-md">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm bg-white"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}