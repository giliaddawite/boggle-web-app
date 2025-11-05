# Boggle Challenge Game

A competitive Boggle word game where players can take on timed challenges, compete on leaderboards, and track their progress. Built with React, Vite, TypeScript, and Firebase.

## Project Description

This is a multiplayer Boggle word game that combines classic Boggle gameplay with modern web features. Players can:
- Sign in with Google authentication
- Load and play preset challenge grids (Easy, Medium, Hard)
- Play random generated boards
- Compete for high scores on global leaderboards
- Track their progress across different challenges
- Replay challenges for practice (first attempt only counts for leaderboard)

The game features a timed challenge system where players find words on a 4x4 letter grid. Challenge time limits vary by difficulty, and random games default to 3 minutes. Scores are automatically submitted to Firebase and displayed on the leaderboard.

## Features Implemented

### Authentication
- Google Sign-In integration via Firebase Auth
- User profile display (name and icon)
- Sign out functionality
- Secure user session management

### Leaderboard
- Global leaderboard showing top scores across all challenges
- Filterable by specific challenge (Easy/Medium/Hard)
- Filterable by user's own scores
- Displays user names, photos, scores, and challenge names
- Shows top 20 scores globally or top 10 per challenge
- First attempt only: replays don't update leaderboard scores
- **Rank Change Notifications**: Automatically displays notifications when your rank changes
  - Rank Up: "🎉 Rank Up! #5 → #3\nYou moved up 2 positions!"
  - Rank Down: "📉 Rank Update: #3 → #5\nSomeone beat your score!"
  - First Place: "🏆 #1! You're at the top of the leaderboard!"
  - First Time: "🏆 Your rank: #3 out of 15 players"
  - Tracks previous rank per challenge using localStorage
  - Auto-dismisses after 6 seconds

### Challenges
- Load Challenge functionality with a list of available challenges
- Challenge difficulty levels (Easy, Medium, Hard)
- Challenge badge showing current challenge with first attempt indicator
- High score and high scorer display for each challenge
- Board hides letters with "?" until "Start" is clicked (prevents cheating)
- Automatic score submission when words are found (first attempt only)
- Manual navigation: no auto-redirects, users control their experience
- Replay functionality for practice (leaderboard not updated on replay)

### Tests
- Comprehensive test suite using Vitest and React Testing Library
- Component tests for Auth component
- Component tests for Board component
- Utility tests for Boggle game logic
- Test scripts: `npm test` and `npm run test:ui`

### Core Game Features
- Running list of words found
- Duplicate submission notification
- Start/Stop controls with timed gameplay
- Board revealed only after starting
- Remaining words revealed when time is up
- Timer progress bar with color-coded warnings (green → orange → red)
- Auto-focus input when game starts
- Auto-clear input after each submission
- Milestone celebrations at 10, 20, 30, and 50 words
- Word length hints (min/max letter counts)
- Random mode: always generates new board after each game
- Challenge mode: allows replay of same board (first attempt counts)

## Live Deployment

The application is deployed on Firebase Hosting:

**[Live Demo](https://boggle-solver-c3740.web.app)**

Or visit: `https://boggle-solver-c3740.firebaseapp.com`

## How to Run Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boggle_swe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or the port shown in the terminal)

4. **Run tests**
   ```bash
   # Run tests in headless mode
   npm test
   
   # Run tests with UI
   npm run test:ui
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

### Deploy to Firebase

If you want to deploy your own version:

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

## Project Structure

- `src/ui/`: Main game UI components and state management
- `src/components/`: Reusable components (Auth, Leaderboard, etc.)
- `src/utils/`: Game logic, board generation, and solver algorithms
- `src/test/`: Test setup and configuration
- `src/components/__tests__/`: Component test files
- `src/utils/__tests__/`: Utility function test files

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite

## Technical Details

### Game Logic
- Uses a trie-based DFS algorithm for word validation
- Board generation uses weighted letter distribution (skewed toward vowels)
- Q is displayed as single letter (not QU) - word finding handles Q+U combinations correctly
- Normalizes words to lowercase for case-insensitive matching

### Data Management
- Challenge data needs to be manually populated in Firestore's `challenges` collection
- Scores are automatically submitted to Firebase when words are found during a challenge (first attempt only)
- Leaderboard queries are optimized with Firestore indexes
- Rank tracking: Previous ranks are stored in localStorage per challenge per user
- Rank change notifications: Automatically checked after score submission to compare with previous rank

### Deployment
- Hosted on Firebase Hosting
- Firestore used for challenge storage and leaderboard data
- Firebase Auth for Google Sign-In integration
