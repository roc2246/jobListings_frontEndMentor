<script>
    import Job from "./Job.svelte"

    export let jobs;
</script>

<style>

</style>

<section id="job-list">
    {#each jobs as job}
    <Job
    company={job.company}
    logo={job.logo}
    newPost={job.new}
    featured={job.featured}
    position={job.position}
    role={job.role}
    level={job.level}
    postedAt={job.postedAt}
    contract={job.contract}
    location={job.location}
    languages={job.languages}
    tools={job.tools}
    />
  {/each}
</section>