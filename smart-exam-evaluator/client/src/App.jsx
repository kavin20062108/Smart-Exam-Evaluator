import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ExamManager from './pages/admin/ExamManager';
import QuestionManager from './pages/admin/QuestionManager';
import Results from './pages/admin/Results';
import Analytics from './pages/admin/Analytics';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import ExamList from './pages/student/ExamList';
import TakeExam from './pages/student/TakeExam';
import Result from './pages/student/Result';
import History from './pages/student/History';
import Leaderboard from './pages/student/Leaderboard';


const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="exams" element={<ExamManager />} />
                <Route path="questions/:examId" element={<QuestionManager />} />
                <Route path="results" element={<Results />} />
                <Route path="analytics" element={<Analytics />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="exams" element={<ExamList />} />
                <Route path="exam/:attemptId" element={<TakeExam />} />
                <Route path="result/:attemptId" element={<Result />} />
                <Route path="history" element={<History />} />
                <Route path="leaderboard" element={<Leaderboard />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
        success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
      }}
    />
  </AuthProvider>
);

export default App;
