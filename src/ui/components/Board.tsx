import React from 'react'
import type { Board as BoardType } from '../../utils/boggle'

type Props = {
	board: BoardType
	size: number
}

export function Board({ board, size }: Props) {
	return (
		<div className="board" style={{ width: size*80, height: size*80, gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
			{board.flat().map((ch, i) => (
				<div className="cell" key={i}>{ch}</div>
			))}
		</div>
	)
}


