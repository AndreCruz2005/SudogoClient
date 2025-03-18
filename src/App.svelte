<script>
    import Game from "./lib/Board.svelte";
    import { setContext } from "svelte";
    setContext("backend", "http://localhost:8080");
</script>

<main>
    <Game />
</main>

<style>
</style>
