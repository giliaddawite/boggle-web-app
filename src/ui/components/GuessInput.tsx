import React, { useState, useRef, useEffect } from 'react'

type Props = {
	disabled?: boolean
	allSolutions: string[]
	foundSolutions: string[]
	onCorrect: (answer: string) => void
	gameState?: 'idle' | 'running' | 'stopped'
}

export function GuessInput({ disabled, allSolutions, foundSolutions, onCorrect, gameState }: Props) {
	const [labelText, setLabelText] = useState('Make your first guess!')
	const [input, setInput] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	// Auto-focus input when game starts
	useEffect(() => {
		if (gameState === 'running' && !disabled) {
			inputRef.current?.focus()
		}
	}, [gameState, disabled])

	// Show word length hints
	const minLength = allSolutions.length > 0 ? Math.min(...allSolutions.map(w => w.length)) : 3
	const maxLength = allSolutions.length > 0 ? Math.max(...allSolutions.map(w => w.length)) : 8

	function evaluateInput() {
		const word = input.trim().toLowerCase()
		if (!word) return
		if (foundSolutions.includes(word)) {
			setLabelText(`${word} has already been found!`)
			setInput('') // Clear on duplicate
		} else if (allSolutions.includes(word)) {
			onCorrect(word)
			setLabelText(`${word} is correct!`)
			setInput('') // Clear after successful submission
		} else {
			setLabelText(`${word} is incorrect!`)
			setInput('') // Clear on incorrect
		}
	}

	function keyPress(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			evaluateInput()
		}
	}

	return (
		<div className="Guess-input" style={{ marginTop: 16 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
				<div 
					className="hint" 
					style={{ 
						fontSize: '13px',
						fontWeight: 500,
						color: disabled ? 'var(--muted)' : 'var(--text)',
						transition: 'all 0.3s ease'
					}}
				>
					{labelText}
				</div>
				{!disabled && allSolutions.length > 0 && (
					<div 
						className="hint" 
						style={{ 
							fontSize: '11px',
							color: 'var(--muted)',
							fontStyle: 'italic'
						}}
					>
						{minLength === maxLength ? `${minLength} letters` : `${minLength}-${maxLength} letters`}
					</div>
				)}
			</div>
			<input
				ref={inputRef}
				className="input"
				placeholder={disabled ? 'Start the game to submit words' : 'Type a word and press Enter…'}
				disabled={disabled}
				value={input}
				onKeyPress={keyPress}
				onChange={(e) => setInput(e.target.value)}
				style={{
					fontSize: '15px',
					padding: '12px 16px',
					background: disabled ? 'rgba(15, 23, 42, 0.5)' : '#0b1324',
					cursor: disabled ? 'not-allowed' : 'text'
				}}
			/>
		</div>
	)
}


