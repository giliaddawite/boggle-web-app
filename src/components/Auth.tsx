import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

interface AuthProps {
	user: User | null
}

export default function Auth({ user }: AuthProps) {
	const [imageError, setImageError] = useState(false)

	// Reset error state when user changes
	useEffect(() => {
		setImageError(false)
	}, [user])
	const handleGoogleSignIn = async () => {
		try {
			await signInWithPopup(auth, googleProvider)
		} catch (error) {
			console.error('Error signing in:', error)
			alert('Failed to sign in. Please try again.')
		}
	}

	const handleSignOut = () => {
		signOut(auth)
	}

	if (user) {
		return (
			<div style={{ 
				display: 'flex', 
				alignItems: 'center', 
				gap: '12px',
				flexWrap: 'nowrap',
				minWidth: 0, // Allow text to shrink if needed
				padding: '8px 12px',
				borderRadius: '12px',
				background: 'rgba(255,255,255,0.03)',
				border: '1px solid rgba(255,255,255,0.08)',
				transition: 'all 0.3s ease'
			}}>
				{user.photoURL && !imageError ? (
					<img
						src={user.photoURL}
						alt=""
						onError={() => setImageError(true)}
						style={{
							width: '36px',
							height: '36px',
							borderRadius: '50%',
							border: '2px solid rgba(34,197,94,0.3)',
							boxShadow: '0 2px 8px rgba(34,197,94,0.2)',
							flexShrink: 0,
							objectFit: 'cover',
							display: 'block'
						}}
					/>
				) : (
					<div
						style={{
							width: '36px',
							height: '36px',
							borderRadius: '50%',
							background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
							border: '2px solid rgba(34,197,94,0.3)',
							boxShadow: '0 2px 8px rgba(34,197,94,0.2)',
							flexShrink: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: 'white',
							fontWeight: 700,
							fontSize: '16px'
						}}
					>
						{(user.displayName || user.email || 'U')[0].toUpperCase()}
					</div>
				)}
				<span style={{ 
					fontWeight: 600, 
					color: 'var(--text)',
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					maxWidth: '200px',
					fontSize: '14px'
				}}>
					{user.displayName || 'User'}
				</span>
				<button
					onClick={handleSignOut}
					className="btn"
					style={{
						background: 'linear-gradient(135deg, #ef4444, #dc2626)',
						borderColor: 'rgba(239,68,68,0.4)',
						color: '#fff',
						flexShrink: 0,
						padding: '8px 16px',
						fontSize: '13px',
						fontWeight: 600,
						boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
					}}
				>
					Sign Out
				</button>
			</div>
		)
	}

	return (
		<button
			onClick={handleGoogleSignIn}
			className="btn primary"
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				padding: '10px 16px',
				fontSize: '14px',
				fontWeight: 600
			}}
		>
			<svg style={{ width: '20px', height: '20px', flexShrink: 0 }} viewBox="0 0 24 24">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			<span>Sign in with Google</span>
		</button>
	)
}

