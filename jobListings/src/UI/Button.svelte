<script>
export let selected = false
</script>

<button on:click class={selected === true  ? "applied-filter" : "filter"}><slot /></button>

<style>

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

    background-color: hsl(180, 31%, 95%);
    color: hsl(180, 29%, 50%);
    border: none;

    cursor: pointer;
  }

  button:hover{
    background-color: hsl(180, 29%, 50%);
    color: white
  }

  .applied-filter{
    margin-right: 3.5rem;
    margin-bottom: .5rem;
    margin-top: .5rem;
  }

  .applied-filter:hover{
    background-color: hsl(180, 31%, 95%);
    color: hsl(180, 29%, 50%);
  }

  @media (max-width: 560px){
    
     button {
      margin-left: 0;
      white-space: nowrap;
    }
  }

</style>