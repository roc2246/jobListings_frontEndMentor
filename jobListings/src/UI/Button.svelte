<script>
  export let selected = false;
</script>

<button on:click class={selected === true ? "applied-filter" : "filter"}
  ><slot /></button
>

<style lang="scss">
  @import "../global";
  button {
    display: inline-block;
    height: 2rem;
    margin: 0;
    text-align: center;
    font-size: 15px;
    margin-left: 0.5rem;
    margin-right: 1rem;
    margin-top: -0.25rem;
    margin-bottom: 1rem;

    font-weight: 700;

    background-color: $pale-white;
    color: $green;
    border: none;

    cursor: pointer;
    &:hover {
      background-color: $green;
      color: white;
    }
  }

  .applied-filter {
    margin-right: 3.5rem;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
    &:hover {
      background-color: $pale-white;
      color: $green;
    }
  }

  @media (max-width: 560px) {
    button {
      margin-left: 0;
      white-space: nowrap;
    }
  }
</style>
