import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from "./components/layout/Sidebar";
import TopNavbar from "./components/layout/TopNavbar";
import ResumeAnalysisPage from "./components/ResumeAnalysisPage";
import ResultsDashboard from "./components/ResultsDashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Footer from "./components/layout/Footer";
import LoginPage from "./components/auth/LoginPage";
import RecruiterSignup from "./components/auth/RecruiterSignup";
import CandidateAnalysis from "./components/CandidateAnalysis";
import CandidatesList from "./components/CandidatesList";
import LatestReport from "./components/LatestReport";
import SettingsPage from "./components/SettingsPage";
import HistoryPage from "./pages/HistoryPage";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-white">Loading...</div>;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main App Layout
const Layout = () => {
  return (
    <div className="bg-[#050B14] text-slate-200 font-display min-h-screen flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#050B14] relative">
        <TopNavbar />
        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#222', minHeight: '100vh', zIndex: 9999, position: 'relative' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dashboard Home (Analysis Flow)
const DashboardHome = () => {
  const [jobId, setJobId] = React.useState(null);
  const handleAnalysisStart = (id) => setJobId(id);
  const handleReset = () => setJobId(null);

  // If we wanted to link to results via URL, we would use navigate('/results/:id')
  // But for now, keeping state-based flow for the Home view as requested originally
  return (
    <ErrorBoundary>
      {!jobId ? (
        <ResumeAnalysisPage onAnalysisStart={handleAnalysisStart} />
      ) : (
        <ResultsDashboard jobId={jobId} onReset={handleReset} onSwitchJob={handleAnalysisStart} />
      )}
    </ErrorBoundary>
  );
};

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_HERE";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<RecruiterSignup />} />

            {/* Protected Routes encapsulated in Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/candidates" element={<CandidatesList />} />
              <Route path="/report" element={<LatestReport />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/analysis/:jobId/:filename" element={<CandidateAnalysis />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
