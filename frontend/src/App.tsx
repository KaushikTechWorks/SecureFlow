import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Theme Context
import { CustomThemeProvider, useTheme } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BatchUpload from './pages/BatchUpload';
import Dashboard from './pages/Dashboard';
import Feedback from './pages/Feedback';

// Inner App component that uses the theme
function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a redirect path from the 404.html page
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/batch" element={<BatchUpload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </div>
  );
}

// Theme-aware App component
function ThemedApp() {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <ThemedApp />
    </CustomThemeProvider>
  );
}

export default App;
