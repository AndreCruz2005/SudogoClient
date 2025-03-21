<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<script>
    import axios from "axios";
    import { getContext, onMount } from "svelte";
    import { hideNumbers } from "../global/hideNumbers";

    class BoardCell {
        pos = $state(0);
        default = $state(0);
        inserted = $state(0);
        boxI = 0;
        cellI = 0;
        colI = 0;
        rowI = 0;
        notes = $state(Array.from({length: 9}).fill(false));

        /**
         * @param {number} i
         * @param {number} j
         * @param {number} val
         * @param {number} pos
         */
        constructor(i, j, val, pos) {
            this.pos = pos;
            this.default = val;

            this.boxI = i;
            this.subBoxI = j;

            this.getRow();
            this.getColumn();
        }

        getRow() {
            const boxRow = Math.floor(this.boxI / 3);
            const subBoxRow = Math.floor(this.subBoxI / 3);
            this.rowI = boxRow * 3 + subBoxRow;
        }

        getColumn() {
            const boxCol = this.boxI % 3;
            const subBoxCol = this.subBoxI % 3;
            this.colI = boxCol * 3 + subBoxCol;
        }

        getCellValue() {
            const returnValue = this.default ? this.default : this.inserted;
            return returnValue ? returnValue : "";
        }

        getCellColor() {
            return this.inserted && !this.default ? "color: light-dark(#7975da, #fad83e);" : "";
        }

        getCellClass() {
            if (this.isInvalid()) return "invalid";
            if (this.isFocused()) return "focused";
            if (this.isRelated()) return "related";
        }

        isFocused() {
            return this.pos == focusedCell;
        }

        isInvalid() {
            const row = sudokuBoard.filter((it) => it.rowI == this.rowI);
            const col = sudokuBoard.filter((it) => it.colI == this.colI);
            const box = sudokuBoard.filter((it) => it.boxI == this.boxI);

            for (const group of [row, col, box]) {
                for (const it of group) {
                    if (
                        it !== this && // Exclude the current cell from comparison
                        it.getCellValue() != "" &&
                        it.getCellValue() == this.getCellValue()
                    ) {
                        return true;
                    }
                }
            }
            return false;
        }

        isRelated() {
            if (focusedCell == -1) return false;
            const mainCell = sudokuBoard[focusedCell];
            if (mainCell.rowI == this.rowI || mainCell.colI == this.colI || mainCell.boxI == this.boxI) return true;
            return false;
        }

        erase() {
            this.inserted = 0;
        }
    }

    // Constants
    const backend = getContext("backend");

    // Game state
    let timer = $state(0);
    let errors = $state(0);
    let usedHints = $state(0);
    let won = $state(false);
    let notesMode = $state(false);

    // Board state
    let solution = [];
    let sudokuBoard = $state([]);
    let focusedCell = $state(-1);

    // Difficulty settings
    const difficulties = { EASY: 36, MEDIUM: 29, HARD: 22 };
    let difficulty = $state("MEDIUM");

    const getSudoku = () => {
        axios
            .get(`${backend}/sudoku?hints=81&boxes=true`)
            .then((res) => {
                for (let i = 0; i < res.data.length; i++) solution.push(...res.data[i]);

                // Create sudoku board
                const boardArr = hideNumbers(res.data, difficulties[difficulty]);
                sudokuBoard = [];
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        sudokuBoard.push(new BoardCell(i, j, boardArr[i][j], sudokuBoard.length));
                    }
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    onMount(() => {
        getSudoku();
        const countTime = setInterval(() => {
            if (!won) timer++;
        }, 1000);
    });

    function hasWon() {
        for (let i = 0; i < 81; i++) {
            if (sudokuBoard[i].getCellValue() != solution[i]) {
                won = false;
                return;
            }
        }
        won = true;
    }

    function restart(){
        getSudoku();
        timer = 0;
        errors = 0;
        usedHints = 0;
        won = false;
    }

</script>

<div id="game">
    <div id="game-over" style={`display: ${!won ? 'inline' : 'none'};`}> 
        <h1>GAME OVER</h1>
        <div>TIME USED: {timer} SECONDS</div>
        <div>HINTS USED: {usedHints}</div>
        <div>ERRORS: {errors}</div>
        <div>PENALTY: {timer + usedHints*120 + errors * 60}</div>
        <select bind:value={difficulty} onchange={(e) => {difficulty = e.target.value;}}>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
        </select>
    </div>
    <div id="board">
        {#each Array.from({ length: 9 }, (_, i) => i) as boxI}
            <div class="box">
                {#each sudokuBoard.filter((i) => i.boxI == boxI) as cell}
                    <div
                        id="cell"
                        class={cell.getCellClass()}
                        onclick={() => {
                            focusedCell = focusedCell != cell.pos ? cell.pos : -1;
                        }}
                        style={cell.getCellColor()}
                    >
                        {cell.getCellValue()}
                        <div class="notes">
                            {#each cell.notes as note, idx}
                                <div class="small-number">{note && !cell.getCellValue() ? idx+1 : ""}</div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/each}
    </div>
    <div id="side-deck">
        <div id="top-bar">
            <p>ERRORS: {errors}</p>
            <p>{String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}</p>
        </div>
        <div id="numpad">
            {#each Array.from({ length: 9 }, (_, i) => i + 1) as num}
                <button
                    class="numbutton"
                    onclick={() => {
                        if(!notesMode){
                            sudokuBoard[focusedCell].inserted = num;
                            if (sudokuBoard[focusedCell].isInvalid()) {
                                errors++;
                            }
                            hasWon();
                        }
                        else{
                            sudokuBoard[focusedCell].notes[num-1] = !sudokuBoard[focusedCell].notes[num-1];
                        }
                    }}>{num}</button
                >
            {/each}
            <button
                onclick={() => {
                    if(!notesMode) sudokuBoard[focusedCell].erase();
                    else sudokuBoard[focusedCell].notes = Array.from({length: 9}).fill(false);

                }}>CLEAR</button
            >
            <button
                onclick={() => {
                    if (sudokuBoard[focusedCell].default) return;
                    sudokuBoard[focusedCell].default = solution[focusedCell];
                    usedHints++;
                    hasWon();
                }}>HINT{`(${usedHints})`}</button
            >
            <button
                onclick={() => {
                    notesMode = !notesMode;
                }}>NOTES</button
            >
            <button
                onclick={() => {
                    restart();
                }}>GIVE UP</button
            >
        </div>
    </div>
</div>

<style>
    #game {
        display: flex;
        height: fit-content;

        @media (max-width: 768px) {
            flex-direction: column;
        }
    }

    #side-deck {
        display: flex;
        flex-direction: column;
        width: max-content;
    }

    #top-bar {
        display: flex;
        flex-direction: row;
        flex: 1;
        padding-left: 5%;
        padding-right: 5%;
        justify-content: space-between;
        width: 100%;
    }

    #numpad {
        display: grid;
        grid-template-columns: repeat(3, 9vw);
        padding: 5% 5% 0 5%;
        gap: 10px;
        flex: 15;
    }
    .numbutton {
        font-size: xx-large;
    }
    #board {
        display: grid;
        grid-template-columns: repeat(3, auto);
        width: fit-content;
    }
    .box {
        display: grid;
        grid-template-columns: repeat(3, auto);
        border: 2px solid light-dark(#2c3e50, #e0e0e0);
        aspect-ratio: 1/1;
        width: fit-content;
    }
    #cell {
        position: relative;
        width: 4vw;
        height: 4vw;
        aspect-ratio: 1/1;

        border: 1px solid light-dark(#bdc3c7, #636e72);
        font-size: 40px;
        color: light-dark(#34495e, #dfe6e9);
        text-align: center;
        align-content: center;

        @media (max-width: 1224px) {
            font-size: 30px;
        }

        @media (max-width: 968px) {
            font-size: 20px;
        }
    }
    .box .notes{
        display:  grid;
        grid-template-columns: repeat(3, auto);
        position: absolute; 
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);

        .small-number{
            width: 100%;
            height: 100%;
            font-size: 17px;
            color: light-dark(#6e7c8c, #60a3f0);
            background-color: rgba(0, 0, 0, 0);
            align-content: center;

            @media (max-width: 1624px) {
                font-size: 13px;
            }

            @media (max-width: 1224px) {
                font-size: 9px;
            }
        }
    }
    .box div:hover {
        cursor: pointer;
    }
    .box div.focused {
        background-color: light-dark(#b3eaf5, #6c7e83);
    }
    .box div.related {
        background-color: light-dark(#e2f1fe, #4d585c);
    }
    .box div.invalid {
        background-color: light-dark(#eea1a1, #db6b6b);
    }

    p {
        font-size: x-large;
    }
</style>
