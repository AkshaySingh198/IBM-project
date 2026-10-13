import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RequireAuth } from './components/guards/RequireAuth';
import { RequirePermission } from './components/guards/RequirePermission';
import { SignInPage } from './pages/SignInPage';
import { CaseQueuePage } from './pages/CaseQueuePage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { RevealRequestsPage } from './pages/RevealRequestsPage';
import { AuditPage } from './pages/AuditPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <RequirePermission permission="cases:read">
                    <CaseQueuePage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="/cases/:id"
              element={
                <RequireAuth>
                  <RequirePermission permission="cases:read">
                    <CaseDetailPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="/reveal-requests"
              element={
                <RequireAuth>
                  <RequirePermission permission="cases:read">
                    <RevealRequestsPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="/audit"
              element={
                <RequireAuth>
                  <RequirePermission permission="audit:read">
                    <AuditPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
