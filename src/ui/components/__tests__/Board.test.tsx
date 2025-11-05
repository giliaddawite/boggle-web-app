import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Board } from '../Board'

describe('Board Component', () => {
	it('renders question marks when showLetters is false', () => {
		const board = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		]
		
		render(<Board board={board} size={3} showLetters={false} />)
		
		const cells = screen.getAllByText('?')
		expect(cells).toHaveLength(9) // 3x3 board
	})

	it('renders actual letters when showLetters is true', () => {
		const board = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		]
		
		render(<Board board={board} size={3} showLetters={true} />)
		
		expect(screen.getByText('A')).toBeInTheDocument()
		expect(screen.getByText('B')).toBeInTheDocument()
		expect(screen.getByText('C')).toBeInTheDocument()
	})

	it('renders question marks for empty board', () => {
		render(<Board board={[]} size={4} />)
		
		const cells = screen.getAllByText('?')
		expect(cells).toHaveLength(16) // 4x4 board
	})

	it('converts letters to uppercase', () => {
		const board = [
			['a', 'b', 'c'],
			['d', 'e', 'f']
		]
		
		render(<Board board={board} size={3} showLetters={true} />)
		
		expect(screen.getByText('A')).toBeInTheDocument()
		expect(screen.getByText('B')).toBeInTheDocument()
		expect(screen.getByText('C')).toBeInTheDocument()
	})
})

