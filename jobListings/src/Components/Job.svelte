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

<section class="job">
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
    <p class="posted-at">{postedAt} &#183;</p>
    <p class="contract">{contract} &#183;</p>
    <p class="location">{location} &#183;</p>
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

<style>
  h4,
  p {
    margin: 0;
    padding: 0;
  }

  .job__title {
    cursor: pointer;
  }

  .job {
    display: grid;
    border: solid;
    width: 80%;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding: 1rem;

    grid-template-rows: repeat(auto-fill, 2rem);
    grid-template-columns: 8rem repeat(2, 1fr);
  }

  .job__company,
  .job__details--commitment,
  .job__details--stack {
    display: flex;
    flex-direction: row;
  }

  .job__company {
    grid-row: 1;
    grid-column: 2;
    white-space: nowrap;
  }
  .job__company > p {
    margin-right: 0.5rem;
  }
  .job__title {
    grid-row: 2;
    grid-column: 2;

    white-space: nowrap;
  }
  .job__details--commitment {
    grid-row: 3;
    grid-column: 2;
    flex-wrap: wrap;
  }
  .job__details--commitment > p {
    margin-top: 0.5rem;
  }

  .job__details--stack {
    grid-row-start: 2;
    grid-row-end: 5;
    grid-column: 3;
    margin-top: -0.05rem;
    justify-content: right;
    flex-wrap: wrap;
  }

  hr {
    display: none;
  }

  @media (max-width: 560px) {
    .job {
      grid-template-rows: repeat(6, auto);
      grid-template-columns: repeat(3, auto);
      margin-top: 2rem;
    }

    .job__company,
    .job__title,
    .job__details--commitment,
    .job__details--stack {
      grid-column-start: 1;
      grid-column-end: 3;
      margin-top: 1rem;
    }

    .job__photo {
      position: absolute;
      margin-top: -4rem;
      margin-left: -0.5rem;
      transform: scale(50%);
    }
    .job__company {
      grid-row: 2;
    }
    .job__title {
      grid-row: 3;
    }
    .job__details--commitment {
      grid-row: 4;
    }
    hr {
      display: block;
      height: 0.05rem;
      width: 100%;
      grid-row: 5;
      grid-column-start: 1;
      grid-column-end: 3;
      margin-top: 1.5rem;
    }

    .job__details--stack {
      grid-row: 6;
      justify-content: left;
    }
  }
</style>
