import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ResumePage from '../pages/ResumePage'
import InterviewSetupPage from '../pages/InterviewSetupPage'
import InterviewSessionPage from '../pages/InterviewSessionPage'
import InterviewResultPage from '../pages/InterviewResultPage'
import LearningPage from '../pages/LearningPage'
import LearningSessionPage from '../pages/LearningSessionPage'
import BookStorePage from '../pages/BookStorePage'
import CartPage from '../pages/CartPage'
import OrderPage from '../pages/OrderPage'
import AdminPage from '../pages/AdminPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/auth/login', element: <LoginPage /> },
  { path: '/auth/register', element: <RegisterPage /> },
  {
    element: <Layout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/profile/resume', element: <ResumePage /> },
      { path: '/interview/setup', element: <InterviewSetupPage /> },
      { path: '/interview/session', element: <InterviewSessionPage /> },
      { path: '/interview/result/:id', element: <InterviewResultPage /> },
      { path: '/learning', element: <LearningPage /> },
      { path: '/learning/session', element: <LearningSessionPage /> },
      { path: '/books', element: <BookStorePage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/orders', element: <OrderPage /> },
      { path: '/admin', element: <AdminPage /> },
    ],
  },
])

export default router
