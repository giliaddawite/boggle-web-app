import { useEffect, useMemo, useRef, useState } from 'react'
import { User } from 'firebase/auth'
import { addDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { buildTrie, findAllBoardWords, generateBoard, normalizeWord, type Board, type Trie } from '../utils/boggle'
import { DICTIONARY } from '../utils/dictionary'
import { db } from '../firebase'
import { ToggleGameState } from './components/ToggleGameState'
import { Board as BoardView } from './components/Board'
import { GuessInput } from './components/GuessInput'
import ChallengeList from '../components/ChallengeList'
import Leaderboard from '../components/Leaderboard'

type GameState = 'idle' | 'running' | 'stopped'

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

const DEFAULT_SECONDS = 180

interface BoggleGameProps {
	user: User | null
}

export function BoggleGame({ user }: BoggleGameProps) {
	const [gameState, setGameState] = useState<GameState>('idle')
	const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_SECONDS)
	const [size, setSize] = useState<number>(4)
	const [board, setBoard] = useState<Board>(() => {
		// Don't generate board initially - wait until game starts
		// This prevents empty board from showing
		return []
	})
	const [found, setFound] = useState<string[]>([])
	const [allWords, setAllWords] = useState<string[]>([])
	const [message, setMessage] = useState<string | null>(null)
	const [showChallenges, setShowChallenges] = useState(false)
	const [showLeaderboard, setShowLeaderboard] = useState(false)
	const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
	const [hasSubmittedScore, setHasSubmittedScore] = useState(false) // Track if score already submitted for this challenge
	const [rankChangeMessage, setRankChangeMessage] = useState<string | null>(null) // Track rank change notifications
	const inputRef = useRef<HTMLInputElement | null>(null)

	const trie: Trie = useMemo(() => buildTrie(DICTIONARY), [])

	useEffect(() => {
		if (gameState !== 'running') return
		const tick = () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
		const id = setInterval(tick, 1000)
		return () => clearInterval(id)
	}, [gameState])

	useEffect(() => {
		if (secondsLeft === 0 && gameState === 'running') {
			stopGame()
		}
	}, [secondsLeft, gameState])

	useEffect(() => {
		// Always compute words from the actual board for validation
		// This ensures we validate against what can actually be formed on the board
		if (board && board.length > 0 && Array.isArray(board[0]) && board[0].length > 0) {
			// Precompute all words for current board for fast validation and remaining words list
			// Only compute if board has actual data - check all rows have cells
			const hasValidData = board.every(row => Array.isArray(row) && row.length > 0)
			if (hasValidData) {
				try {
					const words = findAllBoardWords(board, trie)
					console.log('Computed words from board:', words.length, 'words found')
					setAllWords(words)
				} catch (error) {
					console.error('Error computing words from board:', error)
					// Fallback to challenge solutions if available, but log the error
					if (currentChallenge?.solutions) {
						console.warn('Using challenge solutions as fallback due to computation error')
						setAllWords(currentChallenge.solutions)
					}
				}
			}
		} else if (currentChallenge?.solutions) {
			// Only use challenge solutions if board is not yet set
			setAllWords(currentChallenge.solutions)
		}
	}, [board, trie, currentChallenge])

	const handleSelectChallenge = (challenge: Challenge) => {
		setCurrentChallenge(challenge)
		setHasSubmittedScore(false) // Reset score submission tracking for new challenge
		setRankChangeMessage(null) // Clear any previous rank change messages
		
		// Parse grid - handle both array format and JSON string format from Firestore
		let normalizedGrid: Board = []
		
		if (Array.isArray(challenge.grid)) {
			normalizedGrid = challenge.grid.map(row => {
				// If row is a string (JSON), parse it
				if (typeof row === 'string') {
					try {
						const parsed = JSON.parse(row)
						if (Array.isArray(parsed)) {
							return parsed.map(cell => {
								let cellStr = String(cell).trim().toUpperCase()
								// Handle Q/QU - always use just Q
								if (cellStr.includes('QU')) {
									cellStr = cellStr.replace(/QU/g, 'Q')
								}
								if (cellStr.length > 1 && cellStr[0] === 'Q') {
									cellStr = 'Q'
								}
								return cellStr
							})
						}
						return []
					} catch (e) {
						console.error('Failed to parse row as JSON:', row, e)
						return []
					}
				}
				// If row is already an array, use it directly
				if (Array.isArray(row)) {
					return row.map(cell => {
						let cellStr = String(cell).trim().toUpperCase()
						// Handle Q/QU - always use just Q
						if (cellStr.includes('QU')) {
							cellStr = cellStr.replace(/QU/g, 'Q')
						}
						if (cellStr.length > 1 && cellStr[0] === 'Q') {
							cellStr = 'Q'
						}
						return cellStr
					})
				}
				return []
			})
		} else {
			normalizedGrid = []
		}
		
		console.log('Challenge selected:', challenge.name)
		console.log('Challenge grid (raw):', challenge.grid)
		console.log('Normalized grid:', normalizedGrid)
		
		// Verify the grid has data before setting
		if (normalizedGrid.length > 0 && normalizedGrid[0] && normalizedGrid[0].length > 0) {
			setBoard(normalizedGrid)
			setSize(normalizedGrid.length || 4)
			console.log('Board set successfully, size:', normalizedGrid.length)
		} else {
			console.error('Challenge grid is empty or invalid:', challenge.grid)
			// Set empty board - will be handled when starting game
			setBoard([])
		}
		
		setAllWords(challenge.solutions || [])
		setSecondsLeft(challenge.timeLimit)
		setFound([])
		setMessage(null)
		setShowChallenges(false)
		setGameState('idle') // Reset to idle so user can start when ready
	}

	function startGame() {
		// Hybrid approach: Different behavior for challenges vs random mode
		// For challenges: allow starting from 'idle' state (including after Play Again)
		// For random mode: always generate new board
		const isChallengeMode = !!currentChallenge
		const useChallenge = isChallengeMode && (gameState === 'idle' || gameState === 'stopped')
		
		console.log('startGame called:', { useChallenge, isChallengeMode, gameState })
		
		if (useChallenge && currentChallenge) {
			// PRESERVE the challenge - don't clear it!
			const challengeToUse = currentChallenge // Save reference
			
			// Parse grid - handle both array format and JSON string format from Firestore
			let boardCopy: Board = []
			
			if (challengeToUse.grid && Array.isArray(challengeToUse.grid) && challengeToUse.grid.length > 0) {
				boardCopy = challengeToUse.grid.map(row => {
					// If row is a string (JSON), parse it
					if (typeof row === 'string') {
						try {
							const parsed = JSON.parse(row)
							if (Array.isArray(parsed)) {
								return parsed.map(cell => {
								let cellStr = String(cell).trim().toUpperCase()
								// Handle Q/QU - always use just Q
								if (cellStr.includes('QU')) {
									cellStr = cellStr.replace(/QU/g, 'Q')
								}
								if (cellStr.length > 1 && cellStr[0] === 'Q') {
									cellStr = 'Q'
								}
								return cellStr
							})
							}
							return []
						} catch (e) {
							console.error('Failed to parse row as JSON:', row, e)
							return []
						}
					}
					// If row is already an array, use it directly
					if (Array.isArray(row)) {
						return row.map(cell => {
						let cellStr = String(cell).trim().toUpperCase()
						// Handle Q/QU - always use just Q
						if (cellStr.includes('QU')) {
							cellStr = cellStr.replace(/QU/g, 'Q')
						}
						if (cellStr.length > 1 && cellStr[0] === 'Q') {
							cellStr = 'Q'
						}
						return cellStr
					})
					}
					return []
				})
			}
			
			// Verify board has data before setting
			if (boardCopy.length > 0 && boardCopy[0] && boardCopy[0].length > 0) {
				console.log('Setting challenge board:', boardCopy, 'Challenge:', challengeToUse.name)
				setBoard(boardCopy)
				// IMPORTANT: Keep the challenge set!
				// Don't clear currentChallenge - it should stay visible
				setSecondsLeft(challengeToUse.timeLimit)
			} else {
				console.error('Challenge board is empty, generating new board instead')
				// Fall back to generating a new board if challenge board is invalid
				const newBoard = generateBoard(size)
				const boardCopy: Board = newBoard.map(row => [...row])
				setBoard(boardCopy)
				setCurrentChallenge(null) // Only clear on error
				setSecondsLeft(DEFAULT_SECONDS)
			}
		} else {
			// Random mode: Always generate a new board when starting (prevents replay cheating)
			// This ensures users can't replay the same board after seeing answers
			// Generate new random board - ensure it has letters
			let newBoard = generateBoard(size)
			// Verify board has letters - if not, regenerate
			let attempts = 0
			while (attempts < 5 && (!newBoard || newBoard.length === 0 || !newBoard[0] || newBoard[0].length === 0)) {
				console.warn(`Board generation attempt ${attempts + 1} failed, retrying...`)
				newBoard = generateBoard(size)
				attempts++
			}
			
			if (newBoard && newBoard.length > 0 && newBoard[0] && newBoard[0].length > 0) {
				// Create deep copy to avoid mutation
				const boardCopy: Board = newBoard.map(row => [...row])
				console.log('Setting new random board:', boardCopy)
				setBoard(boardCopy)
				setCurrentChallenge(null) // Clear any previous challenge
				setSecondsLeft(DEFAULT_SECONDS)
			} else {
				console.error('Failed to generate valid board after 5 attempts')
				alert('Failed to generate board. Please try again.')
				return
			}
		}
		setFound([])
		setMessage(null)
		setGameState('running')
		setTimeout(() => inputRef.current?.focus(), 0)
	}

	function stopGame() {
		setGameState('stopped')
		// No auto-redirect - let users stay on results forever
		// They can manually navigate with buttons
	}

	function resetGame() {
		setGameState('idle')
		setSecondsLeft(DEFAULT_SECONDS)
		
		// Hybrid approach: Different behavior for challenges vs random mode
		if (currentChallenge) {
			// Challenge mode: Clear challenge and reset
			setCurrentChallenge(null)
			setBoard([])
			setFound([])
			setAllWords([])
			setMessage(null)
		} else {
			// Random mode: Generate a completely new board
			const newBoard = generateBoard(size)
			const boardCopy: Board = newBoard.map(row => [...row])
			setBoard(boardCopy)
			setFound([])
			setAllWords([])
			setMessage(null)
		}
	}

	const submitScore = async (score: number, words: string[]) => {
		try {
			await addDoc(collection(db, 'scores'), {
				challengeId: currentChallenge!.id,
				userId: user!.uid,
				userName: user!.displayName,
				userPhoto: user!.photoURL,
				score: score,
				wordsFound: words,
				timestamp: new Date()
			})
			
			// Check rank change after submitting score
			await checkRankChange(currentChallenge!.id, user!.uid)
		} catch (error) {
			console.error('Error submitting score:', error)
		}
	}

	const checkRankChange = async (challengeId: string, userId: string) => {
		try {
			// Get previous rank from localStorage
			const storageKey = `previousRank_${challengeId}_${userId}`
			const previousRankStr = localStorage.getItem(storageKey)
			const previousRank = previousRankStr ? parseInt(previousRankStr, 10) : null

			// Fetch current leaderboard for this challenge
			const scoresQuery = query(
				collection(db, 'scores'),
				where('challengeId', '==', challengeId),
				orderBy('score', 'desc')
			)
			
			const scoresSnapshot = await getDocs(scoresQuery)
			const scores = scoresSnapshot.docs.map(doc => doc.data())
			const totalPlayers = scores.length
			
			// Find user's current rank (handle ties by finding first occurrence)
			const userIndex = scores.findIndex((s: any) => s.userId === userId)
			const currentRank = userIndex >= 0 ? userIndex + 1 : null

			// Store new rank for next time
			if (currentRank !== null) {
				localStorage.setItem(storageKey, currentRank.toString())
			}

			// Compare and show notification if rank changed
			if (previousRank !== null && currentRank !== null && previousRank !== currentRank) {
				if (currentRank < previousRank) {
					// Moved up
					const diff = previousRank - currentRank
					if (currentRank === 1) {
						// First place achievement
						setRankChangeMessage(`🏆 #1! You're at the top of the leaderboard!`)
					} else {
						setRankChangeMessage(`🎉 Rank Up! #${previousRank} → #${currentRank}\nYou moved up ${diff} position${diff > 1 ? 's' : ''}!`)
					}
				} else if (currentRank > previousRank) {
					// Moved down
					setRankChangeMessage(`📉 Rank Update: #${previousRank} → #${currentRank}\nSomeone beat your score!`)
				}
				
				// Clear message after 6 seconds
				setTimeout(() => setRankChangeMessage(null), 6000)
			} else if (currentRank === 1 && previousRank !== 1) {
				// First place achievement (first time reaching #1)
				setRankChangeMessage(`🏆 #1! You're at the top of the leaderboard!`)
				setTimeout(() => setRankChangeMessage(null), 6000)
			} else if (currentRank !== null && previousRank === null) {
				// First time ranking
				setRankChangeMessage(`🏆 Your rank: #${currentRank} out of ${totalPlayers} player${totalPlayers !== 1 ? 's' : ''}`)
				setTimeout(() => setRankChangeMessage(null), 6000)
			}
		} catch (error) {
			console.error('Error checking rank change:', error)
		}
	}

	function addCorrect(answer: string) {
		const w = normalizeWord(answer)
		if (!w) return
		if (found.includes(w)) { setMessage(`Duplicate: "${w}"`); return }
		if (!allWords.includes(w)) { 
			console.log('Word validation failed:', {
				word: w,
				allWordsLength: allWords.length,
				allWordsSample: allWords.slice(0, 10),
				wordInList: allWords.includes(w),
				board: board
			})
			setMessage(`Not on board: "${w}"`); 
			return 
		}
		
		const newFoundWords = [...found, w]
		setFound(newFoundWords)
		
		// Celebration messages for milestones
		const wordCount = newFoundWords.length
		if (wordCount === 10 || wordCount === 20 || wordCount === 30 || wordCount === 50) {
			setMessage(`🎉 ${wordCount} words! Keep going!`)
		} else {
			setMessage(`Added: "${w}"`)
		}
		
		// Submit score only on first attempt (prevent duplicate leaderboard entries on replay)
		if (currentChallenge && user && !hasSubmittedScore && gameState === 'running') {
			submitScore(newFoundWords.length, newFoundWords)
			setHasSubmittedScore(true) // Mark as submitted to prevent duplicate submissions
		}
	}

	const remaining = useMemo(() => {
		const setFoundWords = new Set(found)
		return allWords.filter((w) => !setFoundWords.has(w)).sort()
	}, [allWords, found])

	const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
	const ss = (secondsLeft % 60).toString().padStart(2, '0')
	const totalTime = currentChallenge?.timeLimit || DEFAULT_SECONDS
	const elapsedSeconds = totalTime - secondsLeft

	return (
		<div>
			<div className="controls" style={{ justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
				<div className="controls" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
					<button 
						className="btn" 
						onClick={() => setShowChallenges(true)}
						style={{
							background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
							borderColor: 'rgba(59,130,246,0.4)',
							color: '#fff',
							boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
						}}
					>
						📋 Load Challenge
					</button>
					<button 
						className="btn" 
						onClick={() => setShowLeaderboard(true)}
						style={{
							background: 'linear-gradient(135deg, #f59e0b, #d97706)',
							borderColor: 'rgba(245,158,11,0.4)',
							color: '#fff',
							boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
						}}
					>
						🏆 Leaderboard
					</button>
					{currentChallenge && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', width: '100%' }}>
							<div style={{
								padding: '10px 18px',
								background: currentChallenge.difficulty === 'easy' 
									? 'linear-gradient(135deg, #4CAF50, #22c55e)' 
									: currentChallenge.difficulty === 'medium' 
									? 'linear-gradient(135deg, #FF9800, #f59e0b)' 
									: 'linear-gradient(135deg, #F44336, #ef4444)',
								color: 'white',
								borderRadius: '12px',
								fontSize: '14px',
								fontWeight: '700',
								textTransform: 'capitalize',
								display: 'inline-flex',
								alignItems: 'center',
								gap: '8px',
								boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 0 20px rgba(34,197,94,0.2)',
								cursor: 'default',
								border: '1px solid rgba(255,255,255,0.2)',
								animation: 'pulse 2s ease infinite'
							}}>
								<span style={{ fontSize: '18px' }}>🎯</span>
								<span>{currentChallenge.name || currentChallenge.difficulty}</span>
							</div>
							{hasSubmittedScore && (
								<div style={{
									fontSize: '11px',
									color: 'var(--muted)',
									fontStyle: 'italic',
									padding: '4px 8px',
									background: 'rgba(255,255,255,0.05)',
									borderRadius: '6px',
									border: '1px solid rgba(255,255,255,0.1)'
								}}>
									ℹ️ First attempt recorded on leaderboard
								</div>
							)}
							{!hasSubmittedScore && gameState === 'stopped' && (
								<div style={{
									fontSize: '11px',
									color: 'var(--muted)',
									fontStyle: 'italic',
									padding: '4px 8px',
									background: 'rgba(255,255,255,0.05)',
									borderRadius: '6px',
									border: '1px solid rgba(255,255,255,0.1)'
								}}>
									ℹ️ Replay - leaderboard not updated
								</div>
							)}
							{user && !hasSubmittedScore && (gameState === 'idle' || gameState === 'running') && (
								<div style={{
									fontSize: '11px',
									color: 'var(--muted)',
									fontStyle: 'italic',
									padding: '6px 10px',
									background: 'rgba(59,130,246,0.1)',
									borderRadius: '6px',
									border: '1px solid rgba(59,130,246,0.2)',
									width: '100%'
								}}>
									ℹ️ Only your <strong>first attempt</strong> will be recorded on the leaderboard
								</div>
							)}
						</div>
					)}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
					<div 
						className="timer" 
						style={{
							color: secondsLeft <= 30 
								? '#ef4444' 
								: secondsLeft <= 60
								? '#f59e0b'
								: '#22c55e',
							textShadow: secondsLeft <= 30 
								? '0 0 20px rgba(239,68,68,0.8)' 
								: secondsLeft <= 60
								? '0 0 20px rgba(245,158,11,0.8)'
								: '0 0 30px rgba(34,197,94,0.6)',
							animation: secondsLeft <= 30 ? 'pulse 1s ease infinite' : 'none',
							background: 'transparent',
							WebkitTextFillColor: secondsLeft <= 30 
								? '#ef4444' 
								: secondsLeft <= 60
								? '#f59e0b'
								: '#22c55e',
							backgroundClip: 'initial',
							WebkitBackgroundClip: 'initial'
						}}
					>
						{mm}:{ss}
					</div>
					{gameState === 'running' && (
						<div style={{
							width: 200,
							height: 4,
							background: 'rgba(255,255,255,0.1)',
							borderRadius: 2,
							overflow: 'hidden',
							position: 'relative'
						}}>
							<div style={{
								width: `${(secondsLeft / totalTime) * 100}%`,
								height: '100%',
								background: secondsLeft <= 30 
									? 'linear-gradient(90deg, #ef4444, #dc2626)' 
									: secondsLeft <= 60
									? 'linear-gradient(90deg, #f59e0b, #d97706)'
									: 'linear-gradient(90deg, #22c55e, #3b82f6)',
								transition: 'width 1s linear, background 0.3s ease',
								borderRadius: 2,
								boxShadow: secondsLeft <= 30 ? '0 0 10px rgba(239,68,68,0.5)' : 'none'
							}} />
						</div>
					)}
				</div>
			</div>
			<ToggleGameState
				gameState={gameState}
				onStart={startGame}
				onStop={stopGame}
				onReset={resetGame}
				size={size}
				onSizeChange={(n) => setSize(n)}
			/>

			{showChallenges && (
				<ChallengeList
					onSelectChallenge={handleSelectChallenge}
					onClose={() => setShowChallenges(false)}
				/>
			)}

			{showLeaderboard && (
				<Leaderboard
					challengeId={currentChallenge?.id}
					onClose={() => setShowLeaderboard(false)}
				/>
			)}

			<div className="grid-wrap">
				<div className="col" style={{ maxWidth: 360 }}>
					<div className="subtitle">Board</div>
					{gameState === 'idle' && !currentChallenge ? (
						<div className="hint" style={{ marginTop: 8 }}>Click Start to reveal the board.</div>
					) : (board && board.length > 0 && board[0] && Array.isArray(board[0]) && board[0].length > 0) ? (
						<BoardView 
							board={board} 
							size={size} 
							showLetters={gameState !== 'idle'} // Hide letters when idle to prevent cheating
						/>
					) : (
						<div className="hint" style={{ marginTop: 8 }}>Board is loading...</div>
					)}
					<GuessInput
						disabled={gameState !== 'running'}
						allSolutions={allWords}
						foundSolutions={found}
						onCorrect={(w) => addCorrect(w)}
						gameState={gameState}
					/>
					{message && (
						<div 
							className="hint" 
							style={{ 
								marginTop: 12,
								padding: '10px 14px',
								background: message.includes('Added') || message.includes('correct') 
									? 'rgba(34,197,94,0.15)' 
									: message.includes('Duplicate') || message.includes('incorrect') || message.includes('Not on board')
									? 'rgba(239,68,68,0.15)'
									: 'rgba(59,130,246,0.15)',
								border: `1px solid ${message.includes('Added') || message.includes('correct')
									? 'rgba(34,197,94,0.3)'
									: message.includes('Duplicate') || message.includes('incorrect') || message.includes('Not on board')
									? 'rgba(239,68,68,0.3)'
									: 'rgba(59,130,246,0.3)'}`,
								borderRadius: '10px',
								fontSize: '13px',
								fontWeight: 600,
								color: message.includes('Added') || message.includes('correct')
									? '#22c55e'
									: message.includes('Duplicate') || message.includes('incorrect') || message.includes('Not on board')
									? '#ef4444'
									: 'var(--text)',
								animation: 'fadeIn 0.3s ease',
								display: 'flex',
								alignItems: 'center',
								gap: '8px'
							}}
						>
							{message.includes('Added') || message.includes('correct') ? '✓' : message.includes('Duplicate') || message.includes('incorrect') || message.includes('Not on board') ? '✗' : 'ℹ'}
							<span>{message}</span>
						</div>
					)}
					{rankChangeMessage && (
						<div 
							style={{ 
								marginTop: 12,
								padding: '14px 18px',
								background: rankChangeMessage.includes('🏆') || rankChangeMessage.includes('Rank Up')
									? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))'
									: rankChangeMessage.includes('📉')
									? 'rgba(245,158,11,0.15)'
									: 'rgba(34,197,94,0.15)',
								border: `1px solid ${rankChangeMessage.includes('🏆') || rankChangeMessage.includes('Rank Up')
									? 'rgba(34,197,94,0.4)'
									: rankChangeMessage.includes('📉')
									? 'rgba(245,158,11,0.4)'
									: 'rgba(34,197,94,0.4)'}`,
								borderRadius: '10px',
								color: 'var(--text)',
								fontSize: '14px',
								fontWeight: 600,
								boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
								animation: 'fadeIn 0.3s ease',
								whiteSpace: 'pre-line',
								lineHeight: '1.6'
							}}
						>
							{rankChangeMessage}
						</div>
					)}
				</div>

				<div className="col">
					<div className="subtitle" style={{ marginBottom: 10, fontSize: '14px', fontWeight: 600 }}>
						Found Words <span style={{ color: 'var(--accent)', fontWeight: 700 }}>({found.length})</span>
					</div>
					<ul className="list">
						{found.length === 0 ? (
							<li style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '20px 0' }}>
								No words found yet. Start typing!
							</li>
						) : (
							found.map((w, idx) => (
								<li key={w} style={{ animationDelay: `${idx * 0.05}s` }}>
									<span>{w}</span>
									<span className="tag ok">✓</span>
								</li>
							))
						)}
					</ul>
				</div>

				<div className="col">
					<div className="subtitle" style={{ marginBottom: 10, fontSize: '14px', fontWeight: 600 }}>
						Remaining Words {gameState === 'stopped' ? (
							<span style={{ color: 'var(--muted)', fontWeight: 700 }}>({remaining.length})</span>
						) : ''}
					</div>
					{gameState !== 'stopped' ? (
						<div className="hint" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
							Stop the game to reveal remaining words.
						</div>
					) : (
						<ul className="list">
							{remaining.length === 0 ? (
								<li style={{ color: 'var(--accent)', fontWeight: 600, padding: '20px 0' }}>
									🎉 You found all the words!
								</li>
							) : (
								remaining.map((w, idx) => (
									<li key={w} style={{ animationDelay: `${idx * 0.03}s` }}>
										<span>{w}</span>
										<span className="tag">left</span>
									</li>
								))
							)}
						</ul>
					)}
				</div>
			</div>

			{gameState === 'stopped' && (
				<div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.1))', borderColor: 'rgba(34,197,94,0.3)' }}>
					<div className="subtitle" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
						🎉 Game Summary
					</div>
					<ul className="list" style={{ maxHeight: 'none', gap: 12 }}>
						<li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
							<span style={{ fontSize: '15px', fontWeight: 600 }}>Total Words Found</span>
							<span className="tag ok" style={{ fontSize: '14px', padding: '6px 14px' }}>{found.length}</span>
						</li>
						<li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
							<span style={{ fontSize: '15px', fontWeight: 600 }}>Total Time</span>
							<span className="tag" style={{ fontSize: '14px', padding: '6px 14px' }}>{elapsedSeconds}s</span>
						</li>
						<li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
							<span style={{ fontSize: '15px', fontWeight: 600 }}>Words Missed</span>
							<span className="tag" style={{ fontSize: '14px', padding: '6px 14px' }}>{remaining.length}</span>
						</li>
						{currentChallenge && user && hasSubmittedScore && (
							<li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
								<span style={{ fontSize: '15px', fontWeight: 600 }}>Score Submitted</span>
								<span className="tag ok" style={{ fontSize: '14px', padding: '6px 14px' }}>✓</span>
							</li>
						)}
						{currentChallenge && user && !hasSubmittedScore && gameState === 'stopped' && (
							<li style={{ padding: '12px 0' }}>
								<span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--muted)' }}>Score Submitted</span>
								<span className="tag" style={{ fontSize: '14px', padding: '6px 14px', color: 'var(--muted)' }}>Replay (no score)</span>
							</li>
						)}
					</ul>
					
					{currentChallenge && user && (
						<div style={{
							marginTop: 16,
							padding: '12px 16px',
							background: 'rgba(59,130,246,0.1)',
							border: '1px solid rgba(59,130,246,0.3)',
							borderRadius: '10px',
							fontSize: '13px',
							color: 'var(--text)',
							lineHeight: '1.5'
						}}>
							<strong style={{ color: 'var(--accent)' }}>ℹ️ Note:</strong> Only your <strong>first attempt</strong> is recorded on the leaderboard. Replays are for practice only.
						</div>
					)}
					
					{/* Manual Navigation Buttons */}
					<div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
						{currentChallenge ? (
							<>
								<button
									className="btn primary"
									onClick={() => {
										// Reset challenge for replay
										setFound([])
										setMessage(null)
										setGameState('idle')
										setSecondsLeft(currentChallenge.timeLimit)
										// Don't reset hasSubmittedScore - keep it true to prevent duplicate submissions
									}}
									style={{
										flex: 1,
										minWidth: '150px',
										padding: '12px 20px',
										fontSize: '14px',
										fontWeight: 600
									}}
								>
									🔄 Play Again
								</button>
								<button
									className="btn"
									onClick={() => {
										setCurrentChallenge(null)
										setBoard([])
										setFound([])
										setAllWords([])
										setMessage(null)
										setGameState('idle')
										setHasSubmittedScore(false)
										setShowChallenges(true)
									}}
									style={{
										flex: 1,
										minWidth: '150px',
										padding: '12px 20px',
										fontSize: '14px',
										fontWeight: 600,
										background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
										borderColor: 'rgba(59,130,246,0.4)',
										color: '#fff',
										boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
									}}
								>
									📋 Back to Challenges
								</button>
							</>
						) : (
							<button
								className="btn primary"
								onClick={() => {
									// Generate new board for random mode
									const newBoard = generateBoard(size)
									const boardCopy: Board = newBoard.map(row => [...row])
									setBoard(boardCopy)
									setFound([])
									setAllWords([])
									setMessage(null)
									setGameState('idle')
									setSecondsLeft(DEFAULT_SECONDS)
								}}
								style={{
									width: '100%',
									padding: '12px 20px',
									fontSize: '14px',
									fontWeight: 600
								}}
							>
								🔄 Play New Game
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}


