
type Props = {
	words: string[]
	totalTime: number
}

export function SummaryResults({ words, totalTime }: Props) {
	return (
		<div className="Summary-results-list">
			<h2>SUMMARY</h2>
			<ul className="list" style={{ maxHeight: 'none' }}>
				<li>Total Words Found: {words.length}</li>
				<li>Total Time: {totalTime} secs</li>
			</ul>
		</div>
	)
}


