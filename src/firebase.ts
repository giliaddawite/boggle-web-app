import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics'

// Firebase config (client-safe keys)
const firebaseConfig = {
	apiKey: 'AIzaSyDZVnVqryVHrInct_oxXuD9UCAG7miF5q4',
	authDomain: 'boggle-solver-c3740.firebaseapp.com',
	projectId: 'boggle-solver-c3740',
	storageBucket: 'boggle-solver-c3740.firebasestorage.app',
	messagingSenderId: '271471114593',
	appId: '1:271471114593:web:78f279b616d447c78a6d20',
	measurementId: 'G-L0B5KS1RCE',
}

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// optional analytics
let analyticsInstance: Analytics | undefined
void (async () => {
	try {
		if (await isSupported()) {
			analyticsInstance = getAnalytics(app)
		}
	} catch {
		// ignore analytics init errors in dev/SSR
	}
})()

export const analytics = analyticsInstance


