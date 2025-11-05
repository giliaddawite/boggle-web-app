import type { Board as BoardType } from '../../utils/boggle'

type Props = {
	board: BoardType
	size: number
	showLetters?: boolean // If false, show "?" instead of letters
}

export function Board({ board, size, showLetters = true }: Props) {
	// Ensure board is properly formatted
	if (!board || !Array.isArray(board) || board.length === 0) {
		return (
			<div 
				className="board" 
				style={{ 
					width: size*80, 
					height: size*80, 
					gridTemplateColumns: `repeat(${size}, 1fr)`, 
					gridTemplateRows: `repeat(${size}, 1fr)` 
				}}
			>
				{Array(size * size).fill(null).map((_, i) => (
					<div className="cell" key={i}>?</div>
				))}
			</div>
		)
	}
	
	// If showLetters is false, show "?" placeholders to prevent cheating
	if (!showLetters) {
		return (
			<div 
				className="board" 
				style={{ 
					width: size*80, 
					height: size*80, 
					gridTemplateColumns: `repeat(${size}, 1fr)`, 
					gridTemplateRows: `repeat(${size}, 1fr)` 
				}}
			>
				{Array(size * size).fill(null).map((_, i) => (
					<div className="cell" key={i}>?</div>
				))}
			</div>
		)
	}
	
	// Directly flatten and display - board should be string[][]
	const cells: string[] = []
	for (let r = 0; r < board.length && r < size; r++) {
		const row = board[r]
		if (Array.isArray(row)) {
			for (let c = 0; c < row.length && c < size; c++) {
				const cell = row[c]
				// Convert to uppercase string, handle Q/QU
				if (cell != null && cell !== undefined) {
					let cellStr = String(cell).trim().toUpperCase()
					// If cell contains "QU", replace with just "Q"
					if (cellStr.includes('QU')) {
						cellStr = cellStr.replace(/QU/g, 'Q')
					}
					// Ensure Q is just one character
					if (cellStr.length > 1 && cellStr[0] === 'Q') {
						cellStr = 'Q'
					}
					cells.push(cellStr || '?')
				} else {
					cells.push('?')
				}
			}
		}
		// Fill remaining columns in this row if needed
		while (cells.length % size !== 0 && cells.length < (r + 1) * size) {
			cells.push('?')
		}
	}
	
	// Ensure we have exactly size * size cells
	while (cells.length < size * size) {
		cells.push('?')
	}
	const displayCells = cells.slice(0, size * size)
	
	return (
		<div 
			className="board" 
			style={{ 
				width: size*80, 
				height: size*80, 
				gridTemplateColumns: `repeat(${size}, 1fr)`, 
				gridTemplateRows: `repeat(${size}, 1fr)` 
			}}
		>
			{displayCells.map((ch, i) => (
				<div 
					className="cell" 
					key={i}
					style={{
						animationDelay: `${i * 0.03}s`
					}}
				>
					{ch}
				</div>
			))}
		</div>
	)
}


