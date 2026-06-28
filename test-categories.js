const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:3000/api/categories');
  const data = await res.json();
  console.log("Categories response:", data);
}
test();
