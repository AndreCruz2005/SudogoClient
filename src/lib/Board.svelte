<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<script>
    import axios from "axios";
    import { getContext, onMount } from "svelte";
    import { hideNumbers } from "../global/hideNumbers";

    // Constants
    const backend = getContext("backend");

    // Board state
    let solution = [];
    let sudokuBoard = $state([]);

    // Relevant cells
    let focusedCell = $state([]);
    let relatedCells = $state({}); // In same box, row and col as focused cell
    let occupiedCells = $state({}); // Where a number has been inserted

    // Difficulty settings
    const difficulties = { EASY: 36, MEDIUM: 29, HARD: 22 };
    let difficulty = $state("MEDIUM");

    const getSudoku = () => {
        axios
            .get(`${backend}/sudoku?hints=81&boxes=true`)
            .then((res) => {
                for (let i = 0; i < res.data.length; i++)
                    solution[i] = res.data[i].slice();
                sudokuBoard = hideNumbers(res.data, difficulties[difficulty]);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const checkWin = () => {
        for(const box in solution){
            for (const cell in box){
                let i = sudokuBoard.indexOf(box), j = box.indexOf(cell);
                if (cell == sudokuBoard[i][j] || cell == eval(occupiedCells[`${i},${j}`])) {
                    continue;
                }
                else{
                    console.log('unsolved');
                    return;
                }
            }
        }
        console.log('solved!');
    }

    onMount(() => {
        getSudoku();
    });

    // When selecting a cell, gets row, column and box of the cell
    function getRelatedCells(boxI, cellI) {
        let cells = {};

        // Get all cells within the same box
        for (let i = 0; i < 9; i++) {
            cells[`${boxI},${i}`] = sudokuBoard[boxI][i];
        }

        // Convert boxI and cellI to global row and column
        // Each box is 3x3
        // boxI: 0 1 2
        //       3 4 5
        //       6 7 8
        const boxRow = Math.floor(boxI / 3);
        const boxCol = boxI % 3;

        // cellI: 0 1 2
        //        3 4 5
        //        6 7 8
        const cellRow = Math.floor(cellI / 3);
        const cellCol = cellI % 3;

        // Get all cells in the same row
        for (let boxColIndex = 0; boxColIndex < 3; boxColIndex++) {
            const rowBoxI = boxRow * 3 + boxColIndex;

            for (let cellColIndex = 0; cellColIndex < 3; cellColIndex++) {
                const rowCellI = cellRow * 3 + cellColIndex;
                const cellKey = `${rowBoxI},${rowCellI}`;

                cells[cellKey] = sudokuBoard[rowBoxI][rowCellI];
                
            }
        }

        // Get all cells in the same column
        for (let boxRowIndex = 0; boxRowIndex < 3; boxRowIndex++) {
            const colBoxI = boxRowIndex * 3 + boxCol;
            
            for (let cellRowIndex = 0; cellRowIndex < 3; cellRowIndex++) {
                const colCellI = cellRowIndex * 3 + cellCol;
                const cellKey = `${colBoxI},${colCellI}`;

                cells[cellKey] = sudokuBoard[colBoxI][colCellI];
                
            }
        }

        relatedCells = cells;
    }

    // Display either the cell's default value or a value inserted by the user
    /**
     * @param {string} cell
     * @param {number} boxI
     * @param {number} cellI
     */
    function getCellValue(cell, boxI, cellI) {
        const key = `${[boxI, cellI]}`;

        if (key in occupiedCells) return occupiedCells[key];
        return cell != "0" ? cell : "";
    }

    function findConflicts(cellKey){
        if(relatedCells[cellKey] == occupiedCells[`${focusedCell[0]},${focusedCell[1]}`]) return "invalid";
        return null;
    }

    function getCellClass(cell, boxI, cellI) {
        const cellKey = `${[boxI, cellI]}`;

        if (focusedCell[0] == boxI && focusedCell[1] == cellI) {
            return "active";
        }
        if (cellKey in relatedCells) {
            const isInvalid = findConflicts(cellKey);
            return isInvalid || "related";
        }
        if (cellKey in occupiedCells) {
            return "occupied";
        }
        return "cell";
    }
</script>

<div id="game">
    <div id="board">
        {#each sudokuBoard as box, boxI}
            <div class="box">
                {#each box as cell, cellI}
                    <div
                        class={getCellClass(cell, boxI, cellI)}
                        onclick={() => {
                            focusedCell = focusedCell[0] === boxI && focusedCell[1] === cellI ? [] : [boxI, cellI];
                            if(focusedCell.length > 0) getRelatedCells(focusedCell[0], focusedCell[1]);
                            else relatedCells = {};
                        }}
                    style={`${[boxI, cellI]}` in occupiedCells ? "color: rgb(221, 186, 116);" : ""}>
                        {getCellValue(cell, boxI, cellI)}
                    </div>
                {/each}
            </div>
        {/each}
    </div>
    <div id="numpad">
        {#each Array.from({ length: 9 }, (_, i) => i + 1) as num}
            <button
                onclick={() => {
                    if (focusedCell && sudokuBoard[focusedCell[0]][focusedCell[1]] === 0) {
                        occupiedCells[`${focusedCell}`] = num;
                        checkWin();
                    }
                }}
                class="numbutton">{num}</button
            >
        {/each}
        <button
            onclick={() => {
                delete occupiedCells[`${focusedCell}`];
            }}>CLEAR</button
        >
        <button  onclick={() => {
            let newB = [...sudokuBoard];
            newB[focusedCell[0]][focusedCell[1]] = solution[focusedCell[0]][focusedCell[1]];
            sudokuBoard = newB;
        }}>HINT</button>
        <button
            onclick={() => {
                getSudoku();
                focusedCell = [];
                occupiedCells = [];
            }}>NEW</button
        >
    </div>
</div>

<style>
    #game {
        display: flex;
        height: fit-content;
    }
    #numpad {
        display: grid;
        grid-template-columns: auto auto auto;
        padding: 5%;
        gap: 10px;
    }
    #numpad button {
        width: 160px;
    }
    .numbutton {
        font-size: xx-large;
    }
    #board {
        display: grid;
        grid-template-columns: auto auto auto;
    }
    .box {
        display: grid;
        grid-template-columns: auto auto auto;
        border: 2px solid light-dark(#2c3e50, #e0e0e0);
    }
    .box div {
        width: 60px;
        height: 60px;
        aspect-ratio: 1/1;
        background-color: light-dark(#f8f9fa, #2d3436);
        border: 1px solid light-dark(#bdc3c7, #636e72);
        font-size: 40px;
        color: light-dark(#34495e, #dfe6e9);
        text-align: center;
        align-content: center;
    }
    .box div:hover {
        cursor: pointer;
    }
    .box div.active {
        background-color: light-dark(rgb(143, 221, 236), #6c7e83);
    }
    .box div.related {
       background-color: light-dark(aquamarine, #4d585c);
    }
    .box div.invalid{
        background-color: rgb(196, 122, 122);
    }
</style>
