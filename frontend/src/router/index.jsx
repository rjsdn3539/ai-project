import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Layout from '../components/Layout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import HomePage from '../pages/HomePage'
import DashboardPage from '../pages/DashboardPage'
import ResumePage from '../pages/ResumePage'
import ProfilePage from '../pages/ProfilePage'
import InterviewSetupPage from '../pages/InterviewSetupPage'
import InterviewHistoryPage from '../pages/InterviewHistoryPage'
import SchedulePage from '../pages/SchedulePage'
import InterviewSessionPage from '../pages/InterviewSessionPage'
import InterviewResultPage from '../pages/InterviewResultPage'
import LearningPage from '../pages/LearningPage'
import LearningSessionPage from '../pages/LearningSessionPage'
import BookStorePage from '../pages/BookStorePage'
import BookDetailPage from '../pages/BookDetailPage'
import CartPage from '../pages/CartPage'
import OrderPage from '../pages/OrderPage'
import AdminPage from '../pages/AdminPage'
import SubscriptionPage from '../pages/SubscriptionPage'
import PlacementTestPage from '../pages/PlacementTestPage'
import WrongNotesPage from '../pages/WrongNotesPage'
import PaymentPage from '../pages/PaymentPage'
import FaqPage from '../pages/FaqPage'
import InquiryPage from '../pages/InquiryPage'
import AchievementsPage from '../pages/AchievementsPage'

function PrivateRoute({ children }) {
  const { accessToken } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!accessToken) {
      navigate('/auth/login', { replace: true })
    }
  }, [accessToken, navigate])

  if (!accessToken) return null
  return children
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/auth/login', element: <LoginPage /> },
  { path: '/auth/register', element: <RegisterPage /> },
  {
    element: <Layout />,
    children: [
      // 공개 페이지
      { path: '/home',        element: <HomePage /> },
      { path: '/books',       element: <BookStorePage /> },
      { path: '/books/:id',   element: <BookDetailPage /> },
      { path: '/subscription', element: <SubscriptionPage /> },
      { path: '/faq',         element: <FaqPage /> },

      // 로그인 필요 페이지
      { path: '/dashboard',            element: <PrivateRoute><DashboardPage /></PrivateRoute> },
      { path: '/profile',              element: <PrivateRoute><ProfilePage /></PrivateRoute> },
      { path: '/profile/resume',       element: <PrivateRoute><ResumePage /></PrivateRoute> },
      { path: '/interview/setup',      element: <PrivateRoute><InterviewSetupPage /></PrivateRoute> },
      { path: '/interview/history',    element: <PrivateRoute><InterviewHistoryPage /></PrivateRoute> },
      { path: '/interview/session',    element: <PrivateRoute><InterviewSessionPage /></PrivateRoute> },
      { path: '/interview/result/:id', element: <PrivateRoute><InterviewResultPage /></PrivateRoute> },
      { path: '/schedule',             element: <PrivateRoute><SchedulePage /></PrivateRoute> },
      { path: '/learning',             element: <PrivateRoute><LearningPage /></PrivateRoute> },
      { path: '/learning/session',     element: <PrivateRoute><LearningSessionPage /></PrivateRoute> },
      { path: '/learning/placement',   element: <PrivateRoute><PlacementTestPage /></PrivateRoute> },
      { path: '/learning/wrong-notes', element: <PrivateRoute><WrongNotesPage /></PrivateRoute> },
      { path: '/cart',         element: <PrivateRoute><CartPage /></PrivateRoute> },
      { path: '/orders',       element: <PrivateRoute><OrderPage /></PrivateRoute> },
      { path: '/payment',      element: <PrivateRoute><PaymentPage /></PrivateRoute> },
      { path: '/inquiry',      element: <PrivateRoute><InquiryPage /></PrivateRoute> },
      { path: '/achievements', element: <PrivateRoute><AchievementsPage /></PrivateRoute> },
      { path: '/admin',        element: <PrivateRoute><AdminPage /></PrivateRoute> },
    ],
  },
])

export default router
