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
  <span class="job__newFeatured">
    <p>{newPost}</p>
    <p>{featured}</p>
  </span>
  <h4 class="job__title">{position}</h4>
  <span class="job__details--commitment">
    <p>{postedAt} &#183;</p>
    <p>{contract} &#183;</p>
    <p>{location} &#183;</p>
  </span>
  <span class="job__details--stack">
    <p>{role}</p>
    <p>{level}</p>
    <p>{languages}</p>
    <p>{tools}</p>
  </span>
</section>

<style>
  .job {
    border: solid;
    width: 80%;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding: 1rem;
  }
</style>
