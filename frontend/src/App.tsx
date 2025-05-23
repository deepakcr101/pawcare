// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';
import { useAuth } from './context/AuthContext'; // Import useAuth

function HomePage() {
  const { user, isLoading } = useAuth(); // Access user and isLoading from context

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to PawCare!</h1>
      <p>Your one-stop solution for pet daycare and management.</p>
      <nav style={{ marginTop: '20px' }}>
        {user ? (
          // If user is logged in, show link to dashboard and logout
          <>
            <Link to="/dashboard" style={{ margin: '0 10px', padding: '10px 20px', border: '1px solid #007bff', borderRadius: '5px', textDecoration: 'none', color: '#007bff' }}>Go to Dashboard</Link>
          </>
        ) : (
          // If not logged in, show login/register links
          <>
            <Link to="/login" style={{ margin: '0 10px', padding: '10px 20px', border: '1px solid #007bff', borderRadius: '5px', textDecoration: 'none', color: '#007bff' }}>Login</Link>
            <Link to="/register" style={{ margin: '0 10px', padding: '10px 20px', border: '1px solid #28a745', borderRadius: '5px', textDecoration: 'none', color: '#28a745' }}>Register</Link>
          </>
        )}
      </nav>
    </div>
  );
}

function DashboardPage() {
  const { user, logout, isLoading } = useAuth(); // Access user, logout, and isLoading from context
  const navigate = useNavigate();

  // If still loading auth state, show loading
  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading user data...</div>;
  }

  // If no user is logged in, redirect to login page
  if (!user) {
    navigate('/login');
    return null; // Or a loading spinner while redirecting
  }

  const handleLogout = () => {
    logout(); // Use the logout function from context
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Welcome to your Dashboard, {user.firstName || 'User'}!</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={handleLogout} style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
        Logout
      </button>
      <p style={{ marginTop: '20px' }}>This is a placeholder. More content coming soon!</p>
    </div>
  );
}


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;