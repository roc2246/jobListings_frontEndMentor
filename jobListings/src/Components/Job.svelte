<script>
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
</script>

<section class="job">
  <div class="job__photo">
    <img src={logo} alt={company} />
  </div>
  <span class="job__company">
    <p class="company">{company}</p>
    <p class="new">{newPost}</p>
    <p class="featured">{featured}</p>
  </span>
  <h4 class="job__title">{position}</h4>
  <span class="job__details--commitment">
    <p class="posted-at">{postedAt} &#183;</p>
    <p class="contract">{contract} &#183;</p>
    <p class="location">{location} &#183;</p>
  </span>
  <span class="job__details--stack">
    <p class="role">{role}</p>
    <p class="level">{level}</p>
    <p class="langiages">{languages}</p>
    {#if tools.length !== 0}
      <p class="tools">{tools}</p>
    {/if}
  </span>
</section>

<style>
  h4,
  p {
    margin: 0;
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
  }
  .job__title {
    grid-row: 2;
    grid-column: 2;
    white-space: nowrap;
  }
  .job__details--commitment {
    grid-row: 3;
    grid-column: 2;
    white-space: nowrap;
    margin-top: 0.5rem;
  }

  .job__details--stack {
    grid-row: 2;
    grid-column: 3;
    justify-content: right;
    flex-wrap: wrap;
  }
  .job__details--stack > p {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  @media (max-width: 480px) {
    .job {
      grid-template-rows: repeat(4, auto);
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

    .job__details--stack {
      grid-row: 5;
      justify-content: left;
    }

    .job__details--stack > p {
      margin-left: 0;
    }
  }
</style>
