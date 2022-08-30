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

<style>
    .job {
      border: solid;
      width: 80%;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      padding: 1rem;
    }
  </style>
  

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
    <p class="tools">{tools}</p>
  </span>
</section>

