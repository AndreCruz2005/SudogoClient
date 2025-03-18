<script>
    import Board from "./lib/Board.svelte";
    import { setContext } from "svelte";
    setContext("backend", "http://localhost:8080");
</script>

<main>
    <Board />
</main>

<style>
</style>
