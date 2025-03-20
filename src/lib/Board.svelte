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
        focused = $state(false);

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
            // Each box is 3×3
            // First find which row the box is in (0, 1, or 2)
            const boxRow = Math.floor(this.boxI / 3);

            // Then find which row within the box the cell is in (0, 1, or 2)
            const subBoxRow = Math.floor(this.subBoxI / 3);

            // Combine to get the actual row (0-8)
            this.rowI = boxRow * 3 + subBoxRow;
        }

        getColumn() {
            // Each box is 3×3
            // First find which column the box is in (0, 1, or 2)
            const boxCol = this.boxI % 3;

            // Then find which column within the box the cell is in (0, 1, or 2)
            const subBoxCol = this.subBoxI % 3;

            // Combine to get the actual column (0-8)
            this.colI = boxCol * 3 + subBoxCol;
        }

        getCellValue() {
            const returnValue = this.default ? this.default : this.inserted;
            return returnValue ? returnValue : "";
        }

        getCellColor() {
            return this.inserted && !this.default
                ? "color: rgb(221, 186, 116);"
                : "";
        }

        getCellClass() {
            if (this.isInvalid()) return "invalid";
            if (this.focused) return "focused";
            if (this.isRelated()) return "related";
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
            if (
                mainCell.rowI == this.rowI ||
                mainCell.colI == this.colI ||
                mainCell.boxI == this.boxI
            )
                return true;
            return false;
        }
    }

    // Constants
    const backend = getContext("backend");

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
                for (let i = 0; i < res.data.length; i++)
                    solution.push(...res.data[i]);

                // Create sudoku board
                const boardArr = hideNumbers(
                    res.data,
                    difficulties[difficulty],
                );
                sudokuBoard = [];
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        sudokuBoard.push(
                            new BoardCell(
                                i,
                                j,
                                boardArr[i][j],
                                sudokuBoard.length,
                            ),
                        );
                    }
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    onMount(() => {
        getSudoku();
    });
</script>

<div id="game">
    <div id="board">
        {#each Array.from({ length: 9 }, (_, i) => i) as boxI}
            <div class="box">
                {#each sudokuBoard.filter((i) => i.boxI == boxI) as cell}
                    <div
                        class={cell.getCellClass()}
                        onclick={() => {
                            if (focusedCell != -1)
                                sudokuBoard[focusedCell].focused = false;

                            if (focusedCell != cell.pos) {
                                focusedCell = cell.pos;
                                sudokuBoard[focusedCell].focused = true;
                            } else {
                                focusedCell = -1;
                            }
                        }}
                        style={cell.getCellColor()}
                    >
                        {cell.getCellValue()}
                    </div>
                {/each}
            </div>
        {/each}
    </div>
    <div id="numpad">
        {#each Array.from({ length: 9 }, (_, i) => i + 1) as num}
            <button
                class="numbutton"
                onclick={() => {
                    sudokuBoard[focusedCell].inserted = num;
                }}>{num}</button
            >
        {/each}
        <button
            onclick={() => {
                sudokuBoard[focusedCell].inserted = 0;
            }}>CLEAR</button
        >
        <button
            onclick={() => {
                sudokuBoard[focusedCell].default = solution[focusedCell];
            }}>HINT</button
        >
        <button
            onclick={() => {
                getSudoku();
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
    .box div.focused {
        background-color: light-dark(rgb(143, 221, 236), #6c7e83);
    }
    .box div.related {
        background-color: light-dark(aquamarine, #4d585c);
    }
    .box div.invalid {
        background-color: light-dark(aquamarine, #4d585c);
    }
</style>
