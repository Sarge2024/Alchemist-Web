import 'dotenv/config';
import fetch from 'node-fetch';

async function test() {
  const url = process.env.DISHALCHEMISTS_API_BASE + '/recipes';
  console.log("Fetching from:", url);
  const res = await fetch(url, { headers: { 'x-api-key': process.env.DISHALCHEMISTS_API_KEY } });
  const data = await res.json();
  console.log("Total recipes:", data.data ? data.data.length : 0);
  if(data.data) {
     console.log("First recipe ID:", data.data[0].id);
  }
}
test();
