import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/common/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Catalog } from './pages/Catalog';
import { BookDetail } from './pages/BookDetail';
import { AdminImport } from './pages/AdminImport';
import { SeatBooking } from './pages/SeatBooking';
import { LearningPath } from './pages/LearningPath';
import { SyllabusMatcher } from './pages/SyllabusMatcher';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { MyShelf } from './pages/MyShelf';
import { ScannerPage } from './pages/ScannerPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { LibrarianDashboard } from './pages/LibrarianDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MemberManagement } from './pages/MemberManagement';
import { AnalyticsPage } from './pages/AnalyticsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                {/* Public & Catalog routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/book/:id" element={<BookDetail />} />
                <Route path="/learning-path" element={<LearningPath />} />
                <Route path="/syllabus-matcher" element={<SyllabusMatcher />} />
                <Route path="/seats" element={<SeatBooking />} />
                <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />

                {/* Comprehensive 22-Chart Analytics & Reporting Module */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Student / General Shelf */}
                <Route
                  path="/my-shelf"
                  element={
                    <ProtectedRoute>
                      <MyShelf />
                    </ProtectedRoute>
                  }
                />

                {/* Mobile Quick Scanner */}
                <Route
                  path="/scan"
                  element={
                    <ProtectedRoute>
                      <ScannerPage />
                    </ProtectedRoute>
                  }
                />

                {/* Role-Specific Dashboards */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/faculty"
                  element={
                    <ProtectedRoute allowedRoles={['FACULTY']}>
                      <FacultyDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/librarian"
                  element={
                    <ProtectedRoute allowedRoles={['LIBRARIAN', 'ADMIN']}>
                      <LibrarianDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/import"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminImport />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/members"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                      <MemberManagement />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
