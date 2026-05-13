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
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import CreateRidePage from './pages/CreateRidePage'
import DashboardPage from './pages/DashboardPage'
import { auth, db } from './firebase'
import LoginPage from './pages/LoginPage'
import ViewRidePage from './pages/ViewRidePage'
import LoadingOverlay from './components/LoadingOverlay'
import { formatTimeForStorage, formatDateForStorage } from './utils/time'
import './App.css'

// Admin email addresses - add your admin emails here
const ADMIN_EMAILS = ['averycab@gmail.com']
const ADMIN_EMAILS_NORMALIZED = ADMIN_EMAILS.map((email) => String(email).toLowerCase())

const normalizeToUsPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  const withoutCountryCode = digits.startsWith('1') ? digits.slice(1) : digits
  const phoneDigits = withoutCountryCode.slice(0, 10)
  return phoneDigits ? `+1${phoneDigits}` : ''
}

const normalizeLeg = (legValue) => ({
  date: String(legValue?.date || '').trim(),
  time: formatTimeForStorage(legValue?.time),
  pickup: String(legValue?.pickup || '').trim(),
  dropoff: String(legValue?.dropoff || '').trim(),
})

const buildRidePayload = (rideData) => {
  const fallbackLegA = {
    date: rideData.date,
    time: rideData.time,
    pickup: rideData.pickup,
    dropoff: rideData.dropoff,
  }
  const legA = normalizeLeg(rideData.legA || fallbackLegA)
  const legB = normalizeLeg(rideData.legB)

  return {
    ...rideData,
    phone: normalizeToUsPhone(rideData.phone),
    phone2: normalizeToUsPhone(rideData.phone2),
    legA,
    legB,
    // Keep legacy flat fields so existing pages and reports remain compatible.
    date: legA.date,
    time: legA.time,
    pickup: legA.pickup,
    dropoff: legB.dropoff || legA.dropoff,
  }
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isRidesLoading, setIsRidesLoading] = useState(false)
  const [rides, setRides] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(Boolean(user))
      setIsRidesLoading(Boolean(user))
      if (user) {
        setCurrentUser({ uid: user.uid, email: user.email })
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email || '',
            updatedAt: formatDateForStorage(),
          },
          { merge: true }
        )
      } else {
        setCurrentUser(null)
      }
      setIsAuthReady(true)
    })

    return unsubscribe
  }, [])

  const isAdmin =
    currentUser && ADMIN_EMAILS_NORMALIZED.includes(String(currentUser.email || '').toLowerCase())

  // Fetch all users
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'))
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const allUsers = snapshot.docs.map((userDoc) => ({
        uid: userDoc.data().uid || userDoc.id,
        email: userDoc.data().email || '',
        name: userDoc.data().name || userDoc.data().displayName || userDoc.data().fullName || '',
      }))
      setUsers(allUsers)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setRides([])
      setIsRidesLoading(false)
      return undefined
    }

    // Build query - filter by userId unless user is admin
    const queryConstraints = []
    if (!isAdmin) {
      queryConstraints.push(where('userId', '==', currentUser.uid))
    }
    const ridesQuery = query(collection(db, 'booking'), ...queryConstraints)

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const nextRides = snapshot.docs.map((rideDoc) => ({
        id: rideDoc.id,
        ...rideDoc.data(),
      }))
      setRides(nextRides)
      setIsRidesLoading(false)
    })

    return unsubscribe
  }, [isAuthenticated, currentUser, isAdmin])

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
    const normalizedPayload = buildRidePayload(payload)
    await updateDoc(doc(db, 'booking', id), {
      ...normalizedPayload,
      userId: currentUser.uid,
      updatedAt: formatDateForStorage(),
    })
  }

 

  const handleDeleteRide = async (id) => {
    await deleteDoc(doc(db, 'booking', id))
  }

  const handleMarkRideDone = async (id, amount) => {
    await updateDoc(doc(db, 'booking', id), {
      status: 'Completed',
      payRate: amount || 'N/A',
      updatedAt: formatDateForStorage(),
    })
  }

  const handleCreateRide = async (newRide) => {
    const { selectedUserId, ...rideData } = newRide
    const normalizedPayload = buildRidePayload(rideData)
    // Use selectedUserId if provided (admin creating for another user), otherwise use current user
    const userId = selectedUserId || currentUser.uid

    const docRef = await addDoc(collection(db, 'booking'), {
      ...normalizedPayload,
      status: 'Pending',
      userId: userId,
      createdAt: formatDateForStorage(),
      updatedAt: formatDateForStorage(),
    })
    
    // Store the document ID as an 'id' field in the document
    await updateDoc(docRef, {
      id: docRef.id,
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
              isAdmin={isAdmin}
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
            <CreateRidePage
              onCreateRide={handleCreateRide}
              isAdmin={isAdmin}
              users={users}
              adminEmails={ADMIN_EMAILS_NORMALIZED}
            />
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
