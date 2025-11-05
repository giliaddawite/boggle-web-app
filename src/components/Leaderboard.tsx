import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { auth } from '../firebase'

interface Score {
	id: string
	challengeId: string
	challengeName?: string
	userId: string
	userName: string
	userPhoto?: string
	score: number
	wordsFound: string[]
	timestamp: any
}

interface LeaderboardProps {
	challengeId?: string // If provided, show leaderboard for specific challenge
	onClose: () => void
}

export default function Leaderboard({ challengeId, onClose }: LeaderboardProps) {
	const [scores, setScores] = useState<Score[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState<'all' | 'challenge' | 'myScores'>('all')
	const currentUserId = auth.currentUser?.uid

	useEffect(() => {
		fetchScores()
	}, [challengeId, filter])

	const fetchScores = async () => {
		try {
			setLoading(true)
			let scoresQuery

			if (filter === 'myScores' && currentUserId) {
				// Get current user's scores only
				if (challengeId) {
					scoresQuery = query(
						collection(db, 'scores'),
						where('challengeId', '==', challengeId),
						where('userId', '==', currentUserId),
						orderBy('score', 'desc'),
						limit(20)
					)
				} else {
					scoresQuery = query(
						collection(db, 'scores'),
						where('userId', '==', currentUserId),
						orderBy('score', 'desc'),
						limit(20)
					)
				}
			} else if (filter === 'challenge' && challengeId) {
				// Get scores for specific challenge
				scoresQuery = query(
					collection(db, 'scores'),
					where('challengeId', '==', challengeId),
					orderBy('score', 'desc'),
					limit(10)
				)
			} else {
				// Get top scores across all challenges (global leaderboard)
				scoresQuery = query(
					collection(db, 'scores'),
					orderBy('score', 'desc'),
					limit(20)
				)
			}

			const scoresSnapshot = await getDocs(scoresQuery)
			const scoresData = await Promise.all(
				scoresSnapshot.docs.map(async (scoreDoc) => {
					const scoreData = { id: scoreDoc.id, ...scoreDoc.data() } as Score
					
					// Get challenge name if needed
					if (!scoreData.challengeName && scoreData.challengeId) {
						try {
							const challengeDocRef = doc(db, 'challenges', scoreData.challengeId)
							const challengeDoc = await getDoc(challengeDocRef)
							if (challengeDoc.exists()) {
								const challengeData = challengeDoc.data()
								scoreData.challengeName = challengeData?.name || 'Unknown Challenge'
							}
						} catch (e) {
							console.error('Error fetching challenge name:', e)
						}
					}
					
					return scoreData
				})
			)

			setScores(scoresData)
			setLoading(false)
		} catch (error) {
			console.error('Error fetching scores:', error)
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
					<p className="subtitle">Loading leaderboard...</p>
				</div>
			</div>
		)
	}

	return (
		<div 
			className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose()
				}
			}}
		>
			<div 
				className="card" 
				style={{ 
					maxWidth: '700px', 
					width: '90%', 
					maxHeight: '85vh', 
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				<div style={{ 
					display: 'flex', 
					justifyContent: 'space-between', 
					alignItems: 'center',
					marginBottom: '20px',
					paddingBottom: '16px',
					borderBottom: '1px solid var(--muted)'
				}}>
					<h2 style={{ 
						fontSize: '24px', 
						fontWeight: 700, 
						color: 'var(--text)', 
						margin: 0 
					}}>
						🏆 Leaderboard
					</h2>
					<button
						onClick={onClose}
						className="btn"
						style={{
							background: 'transparent',
							border: '1px solid var(--muted)',
							padding: '8px 16px',
							fontSize: '18px',
							cursor: 'pointer'
						}}
					>
						×
					</button>
				</div>

				<div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
					<button
						onClick={() => setFilter('all')}
						className="btn"
						style={{
							background: filter === 'all' ? 'var(--accent)' : 'transparent',
							border: `1px solid ${filter === 'all' ? 'var(--accent)' : 'var(--muted)'}`,
							padding: '6px 12px',
							fontSize: '13px'
						}}
					>
						Global
					</button>
					{currentUserId && (
						<button
							onClick={() => setFilter('myScores')}
							className="btn"
							style={{
								background: filter === 'myScores' ? 'var(--accent)' : 'transparent',
								border: `1px solid ${filter === 'myScores' ? 'var(--accent)' : 'var(--muted)'}`,
								padding: '6px 12px',
								fontSize: '13px'
							}}
						>
							My Scores
						</button>
					)}
					{challengeId && (
						<button
							onClick={() => setFilter('challenge')}
							className="btn"
							style={{
								background: filter === 'challenge' ? 'var(--accent)' : 'transparent',
								border: `1px solid ${filter === 'challenge' ? 'var(--accent)' : 'var(--muted)'}`,
								padding: '6px 12px',
								fontSize: '13px'
							}}
						>
							This Challenge
						</button>
					)}
				</div>

				<div style={{ 
					overflowY: 'auto', 
					flex: 1,
					maxHeight: 'calc(85vh - 180px)'
				}}>
					{scores.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
							<p>
								{filter === 'myScores' 
									? "You haven't submitted any scores yet. Play a challenge to see your scores here!"
									: "No scores yet. Be the first to play!"}
							</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{scores.map((score, index) => (
								<div
									key={score.id}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '16px',
										padding: '16px',
										backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
										border: `1px solid ${index === 0 ? 'rgba(255, 215, 0, 0.3)' : 'var(--muted)'}`,
										borderRadius: '8px',
										transition: 'all 0.2s'
									}}
								>
									<div style={{
										fontSize: '24px',
										fontWeight: 700,
										color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--muted)',
										minWidth: '40px',
										textAlign: 'center'
									}}>
										{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
									</div>
									{score.userPhoto && (
										<img
											src={score.userPhoto}
											alt={score.userName}
											style={{
												width: '40px',
												height: '40px',
												borderRadius: '50%',
												border: '2px solid var(--accent)'
											}}
										/>
									)}
									<div style={{ flex: 1, minWidth: 0 }}>
										<p style={{ 
											fontSize: '16px', 
											fontWeight: 600, 
											color: 'var(--text)', 
											margin: '0 0 4px 0',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap'
										}}>
											{score.userName}
										</p>
										{score.challengeName && (
											<p style={{ 
												fontSize: '12px', 
												color: 'var(--muted)', 
												margin: 0 
											}}>
												{score.challengeName}
											</p>
										)}
									</div>
									<div style={{ textAlign: 'right' }}>
										<p style={{ 
											fontSize: '24px', 
											fontWeight: 700, 
											color: 'var(--accent)', 
											margin: '0 0 4px 0' 
										}}>
											{score.score}
										</p>
										<p style={{ 
											fontSize: '11px', 
											color: 'var(--muted)', 
											margin: 0 
										}}>
											words
										</p>
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

