import React, { useEffect, useState } from 'react'

export type GamePhase = 'idle' | 'running' | 'stopped'

type Props = {
	gameState: GamePhase
	onStart: () => void
	onStop: () => void
	onReset?: () => void
	size: number
	onSizeChange: (n: number) => void
}

export function ToggleGameState({ gameState, onStart, onStop, onReset, size, onSizeChange }: Props) {
	const [buttonText, setButtonText] = useState('Start a new game!')

	useEffect(() => {
		if (gameState === 'idle' || gameState === 'stopped') setButtonText('Start a new game!')
		if (gameState === 'running') setButtonText('End game')
	}, [gameState])

	function handleClick() {
		if (gameState === 'idle' || gameState === 'stopped') {
			onStart()
		} else if (gameState === 'running') {
			onStop()
		}
	}

	return (
		<div className="controls" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
			<div className="controls">
				<select
					className="btn"
					value={size}
					onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
					disabled={gameState === 'running'}
				>
					{[3,4,5,6,7,8,9,10].map((n) => (
						<option key={n} value={n}>{n}×{n}</option>
					))}
				</select>
				<button className="btn primary" onClick={handleClick}>{buttonText}</button>
				<button className="btn ghost" onClick={onReset}>Reset</button>
			</div>
		</div>
	)
}


