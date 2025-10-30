# Boggle (Solitaire) – React + Vite

A simple solitaire Boggle game: start a timed round, find words on the board, and see the remaining words when time is up.

## Features
- Running list of words you found
- Duplicate submission notification
- Start/Stop controls
  - Board is hidden until Start
  - Remaining words are revealed on Stop
- Timed game (default 3 minutes)

## Getting Started

Prereqs: Node 18+

```bash
npm install
npm run dev
# build & preview
npm run build
npm run preview
```

## Project Structure
- `src/ui/BoggleGame.tsx`: Main game UI and state
- `src/utils/boggle.ts`: Board generation and solver (DFS + trie)
- `src/utils/dictionary.ts`: Small starter dictionary (replace with a larger word list if desired)

## Customization
- Update game time: edit `DEFAULT_SECONDS` in `src/ui/BoggleGame.tsx`
- Replace dictionary: swap out `DICTIONARY` in `src/utils/dictionary.ts`

## GitHub Setup

```bash
# from project root
git init
git add .
git commit -m "feat: initial boggle solitaire app"

git branch -M main
# create a new private repo on GitHub via UI, then:
git remote add origin https://github.com/<your-username>/boggle-swe.git
git push -u origin main
```

Submit the private repo link in Canvas.
