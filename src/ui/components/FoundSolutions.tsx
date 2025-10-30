import React from 'react'

type Props = {
	headerText: string
	words: string[]
}

export function FoundSolutions({ headerText, words }: Props) {
	return (
		<div className="Found-solutions-list">
			{words.length > 0 && (
				<h4>{headerText}: {words.length}</h4>
			)}
			<ul className="list">
				{words.map((solution) => <li key={solution}>{solution}</li>)}
			</ul>
		</div>
	)
}


