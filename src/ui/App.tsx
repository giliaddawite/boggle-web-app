import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'
import { BoggleGame } from './BoggleGame'
import Auth from '../components/Auth'

export function App() {
	const [user, setUser] = useState<User | null>(null)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user)
		})
		return unsubscribe
	}, [])

	return (
		<div className="container">
			<div className="header">
				<div>
					<div className="title">Boggle Challenge</div>
					<div className="subtitle">Find as many words as you can before time runs out. Compete on leaderboards and take on challenges!</div>
				</div>
				<Auth user={user} />
			</div>
			<div className="card">
				<BoggleGame user={user} />
			</div>
		</div>
	)
}


