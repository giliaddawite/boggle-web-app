import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

interface Challenge {
	id: string
	name: string
	difficulty: string
	timeLimit: number
	grid: string[][]
	solutions: string[]
	highScore?: number
	highScorer?: string
}

interface ChallengeListProps {
	onSelectChallenge: (challenge: Challenge) => void
	onClose: () => void
}

export default function ChallengeList({ onSelectChallenge, onClose }: ChallengeListProps) {
	const [challenges, setChallenges] = useState<Challenge[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchChallenges()
	}, [])

	const fetchChallenges = async () => {
		try {
			const challengesSnapshot = await getDocs(collection(db, 'challenges'))
			const challengesData = await Promise.all(
				challengesSnapshot.docs.map(async (doc) => {
					const challengeData = { id: doc.id, ...doc.data() } as Challenge
					
					// Get high score for this challenge
					const scoresQuery = query(
						collection(db, 'scores'),
						where('challengeId', '==', doc.id),
						orderBy('score', 'desc'),
						limit(1)
					)
					
					try {
						const scoresSnapshot = await getDocs(scoresQuery)
						challengeData.highScore = scoresSnapshot.empty 
							? 0 
							: scoresSnapshot.docs[0].data().score
						challengeData.highScorer = scoresSnapshot.empty
							? 'None'
							: scoresSnapshot.docs[0].data().userName
					} catch {
						// No scores yet or index not ready
						challengeData.highScore = 0
						challengeData.highScorer = 'None'
					}
					
					return challengeData
				})
			)
			
			setChallenges(challengesData)
			setLoading(false)
		} catch (error) {
			console.error('Error fetching challenges:', error)
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div 
				className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
				onClick={(e) => e.target === e.currentTarget && onClose()}
			>
				<div className="card" style={{ minWidth: '300px', textAlign: 'center' }}>
					<p className="subtitle">Loading challenges...</p>
				</div>
			</div>
		)
	}

	return (
		<div 
			className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
			onClick={(e) => {
				// Close when clicking the backdrop
				if (e.target === e.currentTarget) {
					onClose()
				}
			}}
		>
			<div 
				className="card" 
				style={{ 
					maxWidth: '600px', 
					width: '90%', 
					maxHeight: '85vh', 
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column'
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
					<h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Select a Challenge</h2>
					<button 
						onClick={onClose}
						className="btn ghost"
						style={{ 
							fontSize: '28px', 
							lineHeight: '1',
							padding: '4px 12px',
							minWidth: 'auto'
						}}
					>
						×
					</button>
				</div>
				
				<div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
					{challenges.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
							<p>No challenges available</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{challenges.map((challenge) => (
								<div
									key={challenge.id}
									onClick={() => onSelectChallenge(challenge)}
									style={{
										border: '1px solid rgba(255,255,255,0.1)',
										borderRadius: '12px',
										padding: '16px',
										cursor: 'pointer',
										transition: 'all 0.2s',
										background: 'rgba(255,255,255,0.02)'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = 'rgba(34,197,94,0.1)'
										e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
										e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
										<div style={{ flex: 1 }}>
											<h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px 0', textTransform: 'capitalize' }}>
												{challenge.name}
											</h3>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
												<p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
													Difficulty: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{challenge.difficulty}</span>
												</p>
												<p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
													Time Limit: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{challenge.timeLimit}s</span>
												</p>
											</div>
										</div>
										<div style={{ textAlign: 'right', minWidth: '100px' }}>
											<p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)', margin: '0 0 4px 0', lineHeight: '1' }}>
												{challenge.highScore}
											</p>
											<p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 2px 0', fontWeight: 500 }}>High Score</p>
											<p style={{ fontSize: '10px', color: 'var(--muted)', margin: 0, opacity: 0.7 }}>
												{challenge.highScorer || 'None'}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

