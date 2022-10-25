<script>
  import { filterKeys } from "../subscriptions/filterKeys";
  import Button from "../UI/Button.svelte";

  const removeFilter = (key) => {
    const removedKey = key.key;
    fetch("/keys", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: removedKey,
      }),
    });

    $filterKeys = $filterKeys.filter((selectedKey) => {
      return selectedKey !== removedKey;
    });
  };

  const removeAll = () => {
    fetch("/keys/all", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    $filterKeys = []
  }
</script>

<section class="filter-box">
  <div class="filter-box__keys">
    {#if $filterKeys}
      {#each $filterKeys as key}
        <Button selected={true}
          >{key}
          <span
            class="filter-box__remove-filter"
            on:click={removeFilter({ key })}>X</span
          ></Button
        >
      {/each}
    {/if}
  </div>
  <span class="filter-box__clear" on:click={() => removeAll()}>Clear</span>
</section>

<style lang="scss">
  @import "../global";
  .filter-box {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 1rem;

    border-radius: 0.5rem;
    box-shadow: 5px 10px 20px $pale-green;
    margin-top: -2rem;

    margin-bottom: 1rem;
    padding: 1rem;
    background-color: white;
    &__keys {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }
    &__remove-filter {
      position: absolute;
      height: inherit;
      width: 2rem;
      margin-left: 0.4rem;
      margin-top: -0.4rem;
      line-height: 2;
      background-color: $green;
      color: white;
      font-weight: 700;
      &:hover {
        background-color: black;
      }
    }
    &__clear {
      cursor: pointer;
      font-weight: 700;
      color: $pale-green;
      display: flex;
      align-items: center;
      &:hover {
        color: $green;
        text-decoration: underline;
      }
    }
  }

  @media (max-width: 560px) {
    .filter-box {
      &__clear {
        line-height: 4rem;
      }
    }
  }
</style>
