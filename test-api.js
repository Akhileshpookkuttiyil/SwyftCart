const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.get('http://localhost:3000/api/product/list?page=1&limit=50&search=&category=');
    console.log("Success! Found:", res.data.products.length, "products. Total:", res.data.pagination.total);
    console.log("Product IDs:", res.data.products.map(p => p._id).slice(0, 5));
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}

testFetch();
