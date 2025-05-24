// frontend/src/App.tsx
import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';
import { useAuth } from './context/AuthContext'; // Import useAuth
import OwnerDashboard from './pages/dashboards/OwnerDashboard'; // Import new dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';


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

// ... (HomePage component) ...

function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Use useEffect for navigation side effects
  React.useEffect(() => { // <--- Added React.useEffect
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      }
      // You can add other role-based redirects here if needed,
      // similar to how you have it in your separate DashboardPage.tsx file.
      // For now, this handles the unauthenticated case.
    }
  }, [user, isLoading, navigate]); // Dependencies are crucial for useEffect

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading user data...</div>;
  }

  // When user is null, the useEffect will handle navigation.
  // We can return a loading or null here while useEffect does its job.
  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Redirecting to login...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

   // Render the appropriate dashboard component based on user role
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'OWNER':
        return <OwnerDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'CLINIC_STAFF':
      case 'GROOMER':
        return <StaffDashboard role={user.role} />;
      default:
        return (
          <div style={{ textAlign: 'center', marginTop: '20px', color: 'orange' }}>
            <p>Unknown Role: {user.role}. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '960px', margin: '20px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <h2>Welcome, {user.firstName}!</h2>
        <button onClick={handleLogout} style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {renderDashboardContent()}

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