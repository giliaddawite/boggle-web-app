import React, { useEffect, useMemo, useRef, useState } from 'react'
import { buildTrie, findAllBoardWords, generateBoard, normalizeWord, type Board, type Trie } from '../utils/boggle'
import { DICTIONARY } from '../utils/dictionary'
import { ToggleGameState } from './components/ToggleGameState'
import { Board as BoardView } from './components/Board'
import { GuessInput } from './components/GuessInput'
import { FoundSolutions } from './components/FoundSolutions'
import { SummaryResults } from './components/SummaryResults'

type GameState = 'idle' | 'running' | 'stopped'

const DEFAULT_SECONDS = 180

export function BoggleGame() {
	const [gameState, setGameState] = useState<GameState>('idle')
	const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_SECONDS)
	const [size, setSize] = useState<number>(4)
	const [board, setBoard] = useState<Board>(() => generateBoard(4))
	const [guess, setGuess] = useState('')
	const [found, setFound] = useState<string[]>([])
	const [allWords, setAllWords] = useState<string[]>([])
	const [message, setMessage] = useState<string | null>(null)
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
		// Precompute all words for current board for fast validation and remaining words list
		const words = findAllBoardWords(board, trie)
		setAllWords(words)
	}, [board, trie])

	function startGame() {
		setBoard(generateBoard(size))
		setFound([])
		setSecondsLeft(DEFAULT_SECONDS)
		setMessage(null)
		setGameState('running')
		setTimeout(() => inputRef.current?.focus(), 0)
	}

	function stopGame() {
		setGameState('stopped')
	}

	function resetGame() {
		setGameState('idle')
		setSecondsLeft(DEFAULT_SECONDS)
		setBoard(generateBoard(size))
		setFound([])
		setGuess('')
		setMessage(null)
	}

	function addCorrect(answer: string) {
		const w = normalizeWord(answer)
		if (!w) return
		if (found.includes(w)) { setMessage(`Duplicate: "${w}"`); return }
		if (!allWords.includes(w)) { setMessage(`Not on board: "${w}"`); return }
		setFound((prev) => [w, ...prev])
		setMessage(`Added: "${w}"`)
	}

	const remaining = useMemo(() => {
		const setFoundWords = new Set(found)
		return allWords.filter((w) => !setFoundWords.has(w)).sort()
	}, [allWords, found])

	const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
	const ss = (secondsLeft % 60).toString().padStart(2, '0')
	const elapsedSeconds = DEFAULT_SECONDS - secondsLeft

	return (
		<div>
			<ToggleGameState
				gameState={gameState}
				onStart={startGame}
				onStop={stopGame}
				onReset={resetGame}
				size={size}
				onSizeChange={(n) => setSize(n)}
			/>
			<div className="timer">{mm}:{ss}</div>

			<div className="grid-wrap">
				<div className="col" style={{ maxWidth: 360 }}>
					<div className="subtitle">Board</div>
					{gameState === 'idle' ? (
						<div className="hint" style={{ marginTop: 8 }}>Click Start to reveal the board.</div>
					) : (
						<BoardView board={board} size={size} />
					)}
					<GuessInput
						disabled={gameState !== 'running'}
						allSolutions={allWords}
						foundSolutions={found}
						onCorrect={(w) => addCorrect(w)}
					/>
					{message && <div className="hint" style={{ marginTop: 6 }}>{message}</div>}
				</div>

				<div className="col">
					<div className="subtitle" style={{ marginBottom: 6 }}>Found Words ({found.length})</div>
					<ul className="list">
						{found.map((w) => (
							<li key={w}><span>{w}</span><span className="tag ok">valid</span></li>
						))}
					</ul>
				</div>

				<div className="col">
					<div className="subtitle" style={{ marginBottom: 6 }}>Remaining Words {gameState === 'stopped' ? `(${remaining.length})` : ''}</div>
					{gameState !== 'stopped' ? (
						<div className="hint">Stop the game to reveal remaining words.</div>
					) : (
						<ul className="list">
							{remaining.map((w) => (
								<li key={w}><span>{w}</span><span className="tag">left</span></li>
							))}
						</ul>
					)}
				</div>
			</div>

			{gameState === 'stopped' && (
				<div className="card" style={{ marginTop: 16 }}>
					<div className="subtitle">Summary</div>
					<ul className="list" style={{ maxHeight: 'none' }}>
						<li><span>Total Words Found</span><span className="tag ok">{found.length}</span></li>
						<li><span>Total Time (secs)</span><span className="tag">{elapsedSeconds}</span></li>
					</ul>
				</div>
			)}
		</div>
	)
}


