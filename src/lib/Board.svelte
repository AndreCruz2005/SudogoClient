<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<script>
    import axios from "axios";
    import { getContext, onMount } from "svelte";

    let sudokuBoard = $state([]);
    let focusedCell = $state([]);
    
    const difficulties = {EASY:36, MEDIUM:29, HARD:22};
    let difficulty = $state("MEDIUM");

    const getSudoku = () => {
        axios
            .get(`${getContext("backend")}/sudoku?hints=${difficulties[difficulty]}&boxes=true`)
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

</script>
<div id="game">
    <div id="board">
        {#each sudokuBoard as box, boxI}
            <div class="box">
                {#each box as cell, cellI}
                    <div
                        id={focusedCell[0] === boxI && focusedCell[1] === cellI ? "active-cell" : "cell"}
                        onclick={() => {
                            focusedCell =  focusedCell[0] === boxI && focusedCell[1] === cellI ? [] : [boxI, cellI];
                        }}
                    >
                        {cell != 0 ? cell : ""}
                    </div>
                {/each}
            </div>
        {/each}
    </div>
    <div id="numpad">
        {#each Array.from({ length: 9 }, (_, i) => i + 1) as num}
            <button>{num}</button>
        {/each}
    </div>

</div>

<style>
    #game {
        display: flex;
        height: fit-content
    }
    #numpad{
        display: grid;
        grid-template-columns: auto auto auto;
        padding: 5%;
        gap: 10px;
    }
    #numpad button{
        width: 160px;
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
        font-size: 30px;
        color: light-dark(#34495e, #dfe6e9);
        text-align: center;
        align-content: center;
        transition: 0.1s;
    }
    .box div:hover{
        cursor: pointer;
    }
    #active-cell {
        background-color: light-dark( rgb(143, 221, 236), #6c7e83);
    }
</style>
