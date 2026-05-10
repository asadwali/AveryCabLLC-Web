import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import CreateRidePage from './pages/CreateRidePage'
import DashboardPage from './pages/DashboardPage'
import { auth, db } from './firebase'
import LoginPage from './pages/LoginPage'
import ViewRidePage from './pages/ViewRidePage'
import LoadingOverlay from './components/LoadingOverlay'
import { formatTimeForStorage } from './utils/time'
import './App.css'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isRidesLoading, setIsRidesLoading] = useState(false)
  const [rides, setRides] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user))
      setIsRidesLoading(Boolean(user))
      setIsAuthReady(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setRides([])
      setIsRidesLoading(false)
      return undefined
    }

    const ridesQuery = query(collection(db, 'booking'))

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const nextRides = snapshot.docs.map((rideDoc) => ({
        id: rideDoc.id,
        ...rideDoc.data(),
      }))
      setRides(nextRides)
      setIsRidesLoading(false)
    })

    return unsubscribe
  }, [isAuthenticated])

  const handleLogin = async ({ email, password }) => {
    if (!email || !password) {
      return { success: false, message: 'Please enter email and password.' }
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          return { success: false, message: 'User not found.' }
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return { success: false, message: 'Invalid credentials.' }
        case 'auth/invalid-email':
          return { success: false, message: 'Invalid email format.' }
        case 'auth/too-many-requests':
          return { success: false, message: 'Too many attempts. Please try again later.' }
        default:
          return { success: false, message: 'Login failed. Please try again.' }
      }
    }
  }

  const handleLogout = async () => {
    setIsRidesLoading(false)
    await signOut(auth)
  }

  const handleUpdateRide = async (updatedRide) => {
    const { id, ...payload } = updatedRide
    await updateDoc(doc(db, 'booking', id), {
      ...payload,
      time: formatTimeForStorage(payload.time),
      updatedAt: serverTimestamp(),
    })
  }

  const handleDeleteRide = async (id) => {
    await deleteDoc(doc(db, 'booking', id))
  }

  const handleMarkRideDone = async (id) => {
    await updateDoc(doc(db, 'booking', id), {
      status: 'Completed',
      updatedAt: serverTimestamp(),
    })
  }

  const handleCreateRide = async (newRide) => {
    await addDoc(collection(db, 'booking'), {
      ...newRide,
      time: formatTimeForStorage(newRide.time),
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const getStatusClass = (status) => String(status || 'Pending').toLowerCase().replace(/\s+/g, '-')

  if (!isAuthReady) {
    return <LoadingOverlay message="Loading Avery Cab" subMessage="Preparing your session..." />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <DashboardPage
              rides={rides}
              onLogout={handleLogout}
              onUpdateRide={handleUpdateRide}
              onDeleteRide={handleDeleteRide}
              getStatusClass={getStatusClass}
              isLoading={isRidesLoading}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/rides/new"
        element={
          isAuthenticated ? (
            <CreateRidePage onCreateRide={handleCreateRide} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/rides/:id"
        element={
          isAuthenticated ? (
            <ViewRidePage
              rides={rides}
              getStatusClass={getStatusClass}
              onMarkRideDone={handleMarkRideDone}
              isLoading={isRidesLoading}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
