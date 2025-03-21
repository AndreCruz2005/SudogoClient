<script>
    import Game from "./lib/Game.svelte";
    import { setContext } from "svelte";
    setContext("backend", "http://localhost:8080");
</script>

<Game />

<style>
</style>
