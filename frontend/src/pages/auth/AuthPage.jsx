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

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setMessage('');
    setFormData({ email: '', password: '', role: 'USER' });
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
        let errorMessage = 'Authentication failed';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err) => `${err.loc?.[1] || 'Field'}: ${err.msg}`).join(', ');
        }
        throw new Error(errorMessage);
      }

      if (isLogin) {
        const token = data.access_token || data.token || 'authenticated_user_session';
        const role = data.role || formData.role;
        const email = data.email || formData.email;

        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', email);

        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          if (role === 'ADMIN') {
            navigate('/admin/staff');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setMessage(data.message || 'Account created successfully! Please sign in.');
        setIsLogin(true);
        setFormData({ email: '', password: '', role: 'USER' });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
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
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm"
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
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm"
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
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-sm shadow-sm"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}