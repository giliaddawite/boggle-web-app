import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Auth from '../Auth'

// Mock Firebase
vi.mock('../firebase', () => ({
	auth: {},
	googleProvider: {}
}))

// Mock firebase/auth and capture the mocked functions
const mockSignInWithPopup = vi.fn()
const mockSignOut = vi.fn()

vi.mock('firebase/auth', () => ({
	signInWithPopup: mockSignInWithPopup,
	signOut: mockSignOut
}))

describe('Auth Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders sign in button when user is not logged in', () => {
		render(<Auth user={null} />)
		expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
	})

	it('renders user info and sign out button when user is logged in', () => {
		const mockUser = {
			displayName: 'Test User',
			photoURL: 'https://example.com/photo.jpg',
			uid: '123'
		} as any

		render(<Auth user={mockUser} />)
		expect(screen.getByText('Test User')).toBeInTheDocument()
		expect(screen.getByText(/sign out/i)).toBeInTheDocument()
	})

	it('calls signInWithPopup when sign in button is clicked', async () => {
		mockSignInWithPopup.mockResolvedValue({} as any)
		
		render(<Auth user={null} />)
		const signInButton = screen.getByText(/sign in with google/i)
		
		signInButton.click()
		
		expect(mockSignInWithPopup).toHaveBeenCalled()
	})

	it('calls signOut when sign out button is clicked', () => {
		const mockUser = {
			displayName: 'Test User',
			uid: '123'
		} as any

		render(<Auth user={mockUser} />)
		const signOutButton = screen.getByText(/sign out/i)
		
		signOutButton.click()
		
		expect(mockSignOut).toHaveBeenCalled()
	})
})