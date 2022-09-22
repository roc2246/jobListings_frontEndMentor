<script>
  import filterKeys from "../subscriptions/filterKeys";
  import Button from "../UI/Button.svelte";

  export let company;
  export let logo;
  export let newPost;
  export let featured;
  export let position;
  export let role;
  export let level;
  export let postedAt;
  export let contract;
  export let location;
  export let languages;
  export let tools;

  const setFilter = (category) => {
    let keyValue = JSON.stringify(Object.values(category));
    keyValue = keyValue.replace('["', "");
    keyValue = keyValue.replace('"]', "");
    filterKeys.update((keys) => {
      if (!keys.includes(keyValue)) {
        keys = [...keys, keyValue];
        console.log("filter added");
      }
      return [...keys];
    });
  };
</script>

<section class={featured !== false ? "job job--new" : "job"}>
  <div class="job__photo">
    <img src={logo} alt={company} />
  </div>
  <span class="job__company">
    <p class="company">{company}</p>
    {#if newPost !== false}
      <p class="new">NEW!</p>
    {/if}
    {#if featured !== false}
      <p class="featured">FEATURED</p>
    {/if}
  </span>
  <h4 class="job__title">{position}</h4>
  <span class="job__details--commitment">
    <p class="posted-at">{postedAt}&nbsp; &#183; &nbsp;</p>
    <p class="contract">{contract}&nbsp; &#183; &nbsp;</p>
    <p class="location">{location}&nbsp;</p>
  </span>
  <hr />
  <span class="job__details--stack">
    <Button on:click={() => setFilter({ role })}>{role}</Button>
    <Button on:click={() => setFilter({ level })}>{level}</Button>
    {#each languages as language}
      <Button on:click={() => setFilter({ language })}>{language}</Button>
    {/each}
    {#if tools.length !== 0}
      {#each tools as tool}
        <Button on:click={() => setFilter({ tool })}>{tool}</Button>
      {/each}
    {/if}
  </span>
</section>

<style lang="scss">
  @import "../global";
  h4,
  p {
    margin: 0;
    padding: 0;
  }

  hr {
    display: none;
  }

  .job {
    display: grid;
    border-radius: 0.5rem;
    box-shadow: 5px 10px 20px hsl(180, 8%, 52%);
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding: 1rem 1rem 2rem 1rem;
    background-color: white;
    grid-template-rows: repeat(auto-fill, auto);
    grid-template-columns: 8rem repeat(2, 1fr);
    &__photo {
      grid-row-start: 1;
      grid-row-end: 4;
    }
    &__company {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;

      grid-row: 1;
      grid-column: 2;
      font-weight: 700;
      color: hsl(180, 29%, 50%);
      margin-top: 0.05rem;

      & > p {
        margin-right: 1rem;
        margin-top: 0.25rem;
      }
    }
    &--new {
      border-left: solid;
      border-color: hsl(180, 8%, 52%);
    }
    &__title {
      cursor: pointer;
      grid-row: 2;
      grid-column: 2;

      margin-top: 1rem;
      white-space: nowrap;
      font-weight: 700;
      &:hover {
        color: hsl(180, 29%, 50%);
      }
    }
    &__details {
      &--commitment {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        grid-row: 3;
        grid-column: 2;
        & > p {
          margin-top: 0.5rem;
        }
      }
      &--stack {
        display: flex;
        flex-direction: row;
        justify-content: right;
        flex-wrap: wrap;
        grid-row-start: 2;
        grid-row-end: 5;
        grid-column: 3;
        margin-top: -0.05rem;
      }
    }
  }

  .new {
    background-color: hsl(180, 29%, 50%);
    color: white;
    font-weight: 700;
    padding: 0.5rem;
    border-radius: 1rem;
    width: 3rem;
    height: 0.5rem;
    text-align: center;
    line-height: 0.5;
  }

  .featured {
    background-color: black;
    color: white;
    font-weight: 700;
    padding: 0.5rem;
    border-radius: 1rem;
    width: 6rem;
    height: 0.5rem;
    text-align: center;
    line-height: 0.5;
  }

  @media (max-width: 560px) {
    hr {
      display: block;
      height: 0.01rem;
      grid-row: 5;
      grid-column-start: 1;
      grid-column-end: 3;
      margin-top: 1.5rem;
      margin-left: 0.05rem;
      margin-right: 0.75rem;
    }

    .job {
      grid-template-rows: repeat(6, auto);
      grid-template-columns: repeat(3, auto);
      margin-top: 2rem;
      &__photo {
        position: absolute;
        margin-top: -4rem;
        margin-left: -0.5rem;
        transform: scale(50%);
      }
      &__company {
        grid-row: 2;
        flex-wrap: nowrap;
        grid-column-start: 1;
        grid-column-end: 3;
        margin-top: 1rem;
      }
      &__title {
        grid-row: 3;
        grid-column-start: 1;
        grid-column-end: 3;
        margin-top: 1rem;
      }
      &__details {
        &--commitment {
          grid-column-start: 1;
          grid-column-end: 3;
          grid-row: 4;
          margin-top: 1rem;
        }
        &--stack {
          grid-row: 6;
          justify-content: left;
          grid-column-start: 1;
          grid-column-end: 3;
          margin-top: 1rem;
        }
      }
    }
  }
</style>
