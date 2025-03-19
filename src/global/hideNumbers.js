/**
 * @param {number[][]} board
 * @param {number} hints
 */
export function hideNumbers(board, hints){
    let toRemove = 81 - hints;

	while (toRemove > 0) {
		const row = Math.floor(Math.random() * 328) % 9;
		const col = Math.floor(Math.random() * 328) % 9;

		if (board[row][col] != 0) {
			board[row][col] = 0;
			toRemove--;
		}

	}
    return board;
}
