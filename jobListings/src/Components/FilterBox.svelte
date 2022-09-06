<script>
  import filterKeys from "../subscriptions/filterKeys";
  import Button from "../UI/Button.svelte";

  const removeFilter = (key) => {
    let keyValue = JSON.stringify(Object.values(key));
    keyValue = keyValue.replace('["', "");
    keyValue = keyValue.replace('"]', "");
    filterKeys.update((keys) => {
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

<section id="filter-box">
  <div id="filter-box__keys">
    {#each $filterKeys as key}
      <Button>{key} <span class="remove-filter" on:click={removeFilter({ key })}>X</span></Button>
    {/each}
  </div>
  <span id="filter-box__clear" on:click={() => ($filterKeys = [])}>Clear</span>
</section>

<style>
  #filter-box {
    border: solid;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 1rem;
  }

  #filter-box__keys {
    display: flex;
    flex-direction: row;
  }

  .remove-filter {
    border: solid;
  }

  #filter-box__clear {
    cursor: pointer;
  }
</style>
