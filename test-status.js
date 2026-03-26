const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3050/api/v1/dian/status/35e4b065-d5ca-41fe-a057-e28457cf6b6a', {
      headers: { 'x-api-key': 'TwoSixAdminKey123!' },
      timeout: 10000
    });
    console.log("Status:", res.data.statusCode, res.data.statusDescription);
    console.log("IsValid:", res.data.isValid);
    if(res.data.errorMessages) console.log("Errors:", res.data.errorMessages);
  } catch (err) {
    if(err.code === 'ECONNABORTED') console.log("DIAN TIMEOUT!");
    else console.log("Error:", err.message);
  }
}
run();
