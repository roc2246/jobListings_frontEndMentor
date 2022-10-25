import { writable } from "svelte/store";

export const jobsStore = writable(null);
export const filterKeys = writable(null);

export async function getData(url) {
    let response = await fetch(url);
    return response.ok ? await response.json() : null;
  }
  

