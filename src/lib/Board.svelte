<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<script>
    import axios from "axios";
    import { getContext, onMount } from "svelte";

    // Constants
    const backend = getContext("backend");

    // Board state
    let sudokuBoard = $state([]);
    let focusedCell = $state([]);
    let relatedCells = $state([]);
    let occupiedCells = $state({});

    // Difficulty settings
    const difficulties = { EASY: 36, MEDIUM: 29, HARD: 22 };
    let difficulty = $state("MEDIUM");

    const getSudoku = () => {
        axios
            .get(`${backend}/sudoku?hints=${difficulties[difficulty]}&boxes=true`)
            .then((res) => {
                sudokuBoard = res.data;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    onMount(() => {
        getSudoku();
    });

    function get2DIndex(index) {
        const row = Math.floor(index / 3);
        const col = index % 3;

        return [row, col];
    }
    /**
     * @param {any[]} array
     * @param {number} row
     * @param {number} col
     */
    function getRowAndCol(array, row, col) {
        const rowValues = array.slice(row * 3, row * 3 + 3);
        const columnValues = [array[col], array[col + 3], array[col + 6]];

        return [rowValues, columnValues];
    }

    // When selecting a cell, gets row, column and box of the cell
    function getRelatedCells(boxI, cellI) {
        let cells = [];

        // Get all cells within the same box
        for (let i = 0; i < 9; i++) {
            cells.push(`${boxI},${i}`);
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

        // Calculate global row and column (0-8)
        const globalRow = boxRow * 3 + cellRow;
        const globalCol = boxCol * 3 + cellCol;

        // Get all cells in the same row
        for (let boxColIndex = 0; boxColIndex < 3; boxColIndex++) {
            const rowBoxI = boxRow * 3 + boxColIndex;
            for (let cellColIndex = 0; cellColIndex < 3; cellColIndex++) {
                const rowCellI = cellRow * 3 + cellColIndex;
                const cellKey = `${rowBoxI},${rowCellI}`;
                if (!cells.includes(cellKey)) {
                    cells.push(cellKey);
                }
            }
        }

        // Get all cells in the same column
        for (let boxRowIndex = 0; boxRowIndex < 3; boxRowIndex++) {
            const colBoxI = boxRowIndex * 3 + boxCol;
            for (let cellRowIndex = 0; cellRowIndex < 3; cellRowIndex++) {
                const colCellI = cellRowIndex * 3 + cellCol;
                const cellKey = `${colBoxI},${colCellI}`;
                if (!cells.includes(cellKey)) {
                    cells.push(cellKey);
                }
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
        console.log(occupiedCells);
        const key = `${[boxI, cellI]}`;

        if (key in occupiedCells) return occupiedCells[key];
        return cell != "0" ? cell : "";
    }

    function getCellClass(cell, boxI, cellI) {
        if (focusedCell[0] == boxI && focusedCell[1] == cellI) {
            return "active";
        }
        if (relatedCells.includes(`${[boxI, cellI]}`)) {
            return "related";
        }
        if (`${[boxI, cellI]}` in occupiedCells) {
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
                            getRelatedCells(focusedCell[0], focusedCell[1]);
                        }}
                    >
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
        <button>HINT</button>
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
        filter: brightness(1.7);
    }
    .box div.occupied {
        color: rgb(221, 186, 116);
    }
</style>
