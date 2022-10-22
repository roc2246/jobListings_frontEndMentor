<script>
  import filterKeys from "./subscriptions/filterKeys.js";
  import { jobsStore, getData } from "./subscriptions/filterKeys.js";
  import JobGrid from "./Components/JobGrid.svelte";
  import FilterBox from "./Components/FilterBox.svelte";
  import { onMount } from "svelte";

  // Assigns MongoDB data to stores
  onMount(async () => {
    let jobs = await getData("/jobs");

    if (jobs) jobsStore.update((data) => jobs);
  });

  let showFilterBox;

  // Sets jobs based on filters
  let filteredJobs = [];
  $: if ($filterKeys.length === 0) {
    showFilterBox = false;
    filteredJobs = $jobsStore;
  } else {
    let flattenedJobs = [];
    Object.keys($jobsStore).forEach((job) => {
      const values = Object.values($jobsStore[job]).flat();
      flattenedJobs = [...flattenedJobs, values];
    });
    showFilterBox = true;
    filteredJobs = [];
    Object.keys($jobsStore).forEach((job) => {
      const hasFilters =
        $filterKeys.every((key) => flattenedJobs[job].includes(key, 0)) &&
        $filterKeys.length !== 0;
      if (hasFilters) {
        filteredJobs = [...filteredJobs, $jobsStore[job]];
      }
    });
  }
</script>

<header />
<main>
  {#if showFilterBox === true}
    <FilterBox />
  {/if}
  {#if $jobsStore}
    <JobGrid jobs={filteredJobs} />
  {/if}
</main>

<style lang="scss">
  @import "./global";
  header {
    background-image: url("../images/bg-header-desktop.svg");
    background-color: $pale-green;
    background-size: cover;
    height: 10rem;
  }

  main {
    width: 80%;
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 560px) {
    header {
      background-image: url("../images/bg-header-mobile.svg");
      background-repeat: no-repeat;
    }
  }
</style>
