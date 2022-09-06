<script>
export let category = null;
</script>

<button on:click class="{category}"><slot /></button>

<style>

button {
    display: inline-block;
    height: 2rem;
    margin: 0;
    text-align: center;
    font-size: 15px;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    margin-top: -0.25rem;
    margin-bottom: 0.75rem;

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

  @media (max-width: 560px){
    
     button {
      margin-left: 0;
      white-space: nowrap;
    }
  }

</style>