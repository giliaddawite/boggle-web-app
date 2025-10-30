import React, { useState } from 'react'

type Props = {
	disabled?: boolean
	allSolutions: string[]
	foundSolutions: string[]
	onCorrect: (answer: string) => void
}

export function GuessInput({ disabled, allSolutions, foundSolutions, onCorrect }: Props) {
	const [labelText, setLabelText] = useState('Make your first guess!')
	const [input, setInput] = useState('')

	function evaluateInput() {
		const word = input.trim().toLowerCase()
		if (!word) return
		if (foundSolutions.includes(word)) {
			setLabelText(`${word} has already been found!`)
		} else if (allSolutions.includes(word)) {
			onCorrect(word)
			setLabelText(`${word} is correct!`)
		} else {
			setLabelText(`${word} is incorrect!`)
		}
	}

	function keyPress(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			;(e.target as HTMLInputElement).value = ''
			setInput('')
			evaluateInput()
		}
	}

	return (
		<div className="Guess-input" style={{ marginTop: 8 }}>
			<div className="hint" style={{ marginBottom: 6 }}>{labelText}</div>
			<input
				className="input"
				placeholder={disabled ? 'Start the game to submit words' : 'Type a word and press Enter…'}
				disabled={disabled}
				onKeyPress={keyPress}
				onChange={(e) => setInput(e.target.value)}
			/>
		</div>
	)
}


