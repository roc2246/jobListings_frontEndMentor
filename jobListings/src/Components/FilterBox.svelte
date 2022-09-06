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
      <Button
        >{key}
        <span class="remove-filter" on:click={removeFilter({ key })}>X</span
        ></Button
      >
    {/each}
  </div>
  <span id="filter-box__clear" on:click={() => ($filterKeys = [])}>Clear</span>
</section>

<style>
  #filter-box {
    display: flex;
    flex-direction: row;
    /* flex-wrap: wrap; */
    justify-content: space-between;
    padding: 1rem;

    border-radius: .5rem;
    box-shadow: 5px 10px 20px hsl(180, 8%, 52%);
    margin-top: -2rem;

    margin-bottom: 1rem;
    padding: 1rem;
background-color: white;
  }

  #filter-box__keys {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .remove-filter {
    border: solid;
  }

  #filter-box__clear {
    cursor: pointer;
  }
  @media (max-width: 560px) {
    #filter-box__clear {
      line-height: 4rem;
    }
  }
</style>
