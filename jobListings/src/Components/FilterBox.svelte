<script>
  import filterKeys from "../subscriptions/filterKeys";
  import Button from "../UI/Button.svelte";

  const removeFilter = (key) => {
    let keyValue = JSON.stringify(Object.values(key));
    keyValue = keyValue.replace('["', "");
    keyValue = keyValue.replace('"]', "");
    filterKeys.update((keys) => {
        console.log(keys)
        console.log(keyValue)
      if (keys.includes(keyValue)) {
        keys = keys.filter((value) => {
          return value !== keyValue;
        });
        console.log("filter removed");
      } 
      return [...keys];
    });
  };
</script>

<section id="filters">
  {#each $filterKeys as key}
    <Button on:click={removeFilter({ key })}>{key}</Button>
  {/each}
</section>

<style>
</style>
