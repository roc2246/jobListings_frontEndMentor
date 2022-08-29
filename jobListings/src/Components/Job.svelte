<script>
    export let title;
    export let imgSrc;
    export let postDate;
    export let commitment;
    export let location
</script>



<section class="job">
    <div class="job__photo">
        <img src="{imgSrc}" alt="{title}">
    </div>
    <h4 class="job__title">{title}</h4>
    <span class="job__details">
        <p>{postDate} &#183;</p>
        <p>{commitment} &#183;</p>
        <p>{location} &#183;</p>
    </span>
</section>

<style>
.job{
    border: solid;
    width: 75%;
    margin: 2rem;
}
</style>