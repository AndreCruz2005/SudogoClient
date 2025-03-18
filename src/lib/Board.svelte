<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<script>
    import axios from "axios";
    import { getContext, onMount } from "svelte";

    let sudokuBoard = $state([]);
    let focusedCell = $state([]);

    const getSudoku = () => {
        axios
            .get(`${getContext("backend")}/sudoku?hints=40`)
            .then((res) => {
                console.log(res.data);
                sudokuBoard = getBoxes(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    onMount(() => {
        getSudoku();
    });

    // Function to get 3x3 boxes from the 9x9 grid
    function getBoxes(arr) {
        let boxes = [];

        // Iterates over all the boxes
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                // Creates each box
                let box = [];

                // Iterates over all cells in the box
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const cell = arr[boxRow * 3 + i][boxCol * 3 + j];
                        box.push(cell > 0 ? cell : "");
                    }
                }
                boxes.push(box);
            }
        }
        return boxes;
    }
</script>

<div id="board">
    {#each sudokuBoard as box, boxI}
        <div class="box">
            {#each box as cell, cellI}
                <div
                    id={focusedCell[0] === boxI && focusedCell[1] === cellI ? "active-cell" : "cell"}
                    onclick={() => {
                        focusedCell = [boxI, cellI];
                    }}
                >
                    {cell}
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
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
        font-size: 30px;
        color: light-dark(#34495e, #dfe6e9);
        text-align: center;
        align-content: center;
        transition: 0.1s;
    }
    #active-cell {
        background-color: light-dark(#f8f9fa, rgb(24, 174, 205));
    }
</style>
