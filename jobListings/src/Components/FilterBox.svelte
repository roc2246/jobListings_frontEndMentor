<script>
    import filterKeys from "../subscriptions/filterKeys"
    import Button from "../UI/Button.svelte";

</script>

<section id="filters">
    {#each $filterKeys as key}
        <Button>{key}</Button>
    {/each}
</section>

<style>

</style>