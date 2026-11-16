import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { PageLoader } from './components/layout/PageLoader';
import { ScrollManager } from './components/layout/ScrollManager';
import { SessionGate } from './lib/session/SessionGate';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Parcours de compte chargé à la demande : la landing page n'embarque ni la démo ni keycloak-js.
const AccountShell = lazy(() => import('./lib/session/AccountShell'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const CompanyPage = lazy(() => import('./pages/onboarding/CompanyPage'));
const PreferencesPage = lazy(() => import('./pages/onboarding/PreferencesPage'));
const PlanPage = lazy(() => import('./pages/onboarding/PlanPage'));
const ConnectProvidersPage = lazy(() => import('./pages/onboarding/ConnectProvidersPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DashboardProvidersPage = lazy(() => import('./pages/DashboardProvidersPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollManager />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<AccountShell />}>
              <Route
                path="/connexion"
                element={
                  <SessionGate require="guest">
                    <LoginPage />
                  </SessionGate>
                }
              />
              <Route path="/login" element={<Navigate to="/connexion" replace />} />
              <Route
                path="/register"
                element={
                  <SessionGate require="guest">
                    <RegisterPage />
                  </SessionGate>
                }
              />
              <Route path="/inscription" element={<Navigate to="/register" replace />} />
              <Route
                path="/verify-email"
                element={
                  <SessionGate require="unverified">
                    <VerifyEmailPage />
                  </SessionGate>
                }
              />
              <Route path="/onboarding">
                <Route index element={<Navigate to="company" replace />} />
                <Route
                  path="company"
                  element={
                    <SessionGate require={{ step: 'COMPANY' }}>
                      <CompanyPage />
                    </SessionGate>
                  }
                />
                <Route
                  path="preferences"
                  element={
                    <SessionGate require={{ step: 'PREFERENCES' }}>
                      <PreferencesPage />
                    </SessionGate>
                  }
                />
                <Route
                  path="plan"
                  element={
                    <SessionGate require={{ step: 'PLAN' }}>
                      <PlanPage />
                    </SessionGate>
                  }
                />
                <Route
                  path="connect-providers"
                  element={
                    <SessionGate require={{ step: 'PROVIDERS' }}>
                      <ConnectProvidersPage />
                    </SessionGate>
                  }
                />
              </Route>
              <Route
                path="/app"
                element={
                  <SessionGate require="app">
                    <DashboardPage />
                  </SessionGate>
                }
              />
              <Route
                path="/app/prestataires"
                element={
                  <SessionGate require="app">
                    <DashboardProvidersPage />
                  </SessionGate>
                }
              />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
