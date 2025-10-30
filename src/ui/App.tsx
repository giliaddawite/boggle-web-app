import React from 'react'
import { BoggleGame } from './BoggleGame'

export function App() {
	return (
		<div className="container">
			<div className="header">
				<div>
					<div className="title">Boggle (Solitaire)</div>
					<div className="subtitle">Find as many words as you can before time runs out.</div>
				</div>
			</div>
			<div className="card">
				<BoggleGame />
			</div>
		</div>
	)
}


