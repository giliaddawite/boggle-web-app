export type Board = string[][] // NxN

export type Trie = {
	children: Map<string, Trie>
	end: boolean
}

export function buildTrie(words: string[]): Trie {
	const root: Trie = { children: new Map(), end: false }
	for (const raw of words) {
		const w = normalizeWord(raw)
		if (w.length < 3) continue
		let node = root
		for (const ch of w) {
			if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false })
			node = node.children.get(ch)!
		}
		node.end = true
	}
	return root
}

const LETTERS = 'aaabcdeeefghhijklmnopqrstuvwxyyzz' // skew slightly toward vowels

export function generateBoard(size: number = 4): Board {
	const n = Math.max(2, Math.min(12, Math.floor(size)))
	const b: Board = []
	for (let r = 0; r < n; r++) {
		const row: string[] = []
		for (let c = 0; c < n; c++) {
			const ch = LETTERS[Math.floor(Math.random() * LETTERS.length)]
			row.push(ch)
		}
		b.push(row)
	}
	return b
}

export function normalizeWord(w: string): string {
	return w.trim().toLowerCase().replace(/[^a-z]/g, '')
}

export function findAllBoardWords(board: Board, trie: Trie): string[] {
	const R = board.length
	const C = board[0].length
	const seen = new Set<string>()
	const results = new Set<string>()

	const dirs = [-1, 0, 1]

	function key(r: number, c: number) { return `${r},${c}` }

	function dfs(r: number, c: number, node: Trie, path: string) {
		const k = key(r, c)
		if (seen.has(k)) return
		const ch = board[r][c]
		const next = node.children.get(ch)
		if (!next) return
		const word = path + ch
		if (next.end && word.length >= 3) results.add(word)
		seen.add(k)
		for (const dr of dirs) for (const dc of dirs) {
			if (dr === 0 && dc === 0) continue
			const nr = r + dr, nc = c + dc
			if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue
			dfs(nr, nc, next, word)
		}
		seen.delete(k)
	}

	for (let r = 0; r < R; r++) {
		for (let c = 0; c < C; c++) {
			dfs(r, c, trie, '')
		}
	}

	return Array.from(results)
}


