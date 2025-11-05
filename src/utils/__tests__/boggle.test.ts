import { describe, it, expect } from 'vitest'
import { generateBoard, normalizeWord, findAllBoardWords } from '../boggle'
import { buildTrie } from '../boggle'

describe('Boggle Utils', () => {
	describe('generateBoard', () => {
		it('generates a board of the correct size', () => {
			const board = generateBoard(4)
			expect(board).toHaveLength(4)
			expect(board[0]).toHaveLength(4)
		})

		it('generates a board with letters', () => {
			const board = generateBoard(3)
			expect(board[0][0]).toMatch(/[A-Z]/)
		})

		it('handles different sizes', () => {
			const board3 = generateBoard(3)
			const board5 = generateBoard(5)
			
			expect(board3).toHaveLength(3)
			expect(board5).toHaveLength(5)
		})
	})

	describe('normalizeWord', () => {
		it('converts to lowercase', () => {
			expect(normalizeWord('HELLO')).toBe('hello')
		})

		it('removes non-alphabetic characters', () => {
			expect(normalizeWord('hello!')).toBe('hello')
			expect(normalizeWord('test123')).toBe('test')
		})

		it('trims whitespace', () => {
			expect(normalizeWord('  hello  ')).toBe('hello')
		})
	})

	describe('findAllBoardWords', () => {
		it('finds words on the board', () => {
			const dictionary = ['cat', 'dog', 'hat']
			const trie = buildTrie(dictionary)
			
			// Create a simple board that contains 'cat'
			const board = [
				['C', 'A', 'T'],
				['D', 'O', 'G'],
				['H', 'A', 'T']
			]
			
			const words = findAllBoardWords(board, trie)
			
			// Should find words that exist in dictionary and on board
			expect(words.length).toBeGreaterThan(0)
		})

		it('returns empty array for empty board', () => {
			const dictionary = ['cat', 'dog']
			const trie = buildTrie(dictionary)
			
			const board: string[][] = []
			const words = findAllBoardWords(board, trie)
			
			expect(words).toHaveLength(0)
		})
	})
})

