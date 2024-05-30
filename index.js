const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const app = express();
const cors = require("cors");
app.use(cors());
const pool = new Pool({
  connectionString:
    "postgres://default:xnqLSI9kFY8a@ep-ancient-cake-a1sq6ks9-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
});
app.get("/", (req, res) => {
  res.send("standby");
});

async function savetodb() {
  const client = await pool.connect();
  //fetching
  const apiUrl =
    "https://api.qubitro.com/v2/projects/b9aabf51-edf2-4885-b211-8a424cb55208/devices/f7566774-46ea-4b09-bb19-63fd19699594/data?page=1&limit=1&range=all";

  // Make GET request to Qubitro API
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: "Bearer QB_BzKTp5dhQP3--u1T9q1MYcpYJTO4reb4IY81Qax-",
    },
  })
    .then((respon) => respon.json())
    .then(({ data }) => data);

  const result = await pool.query(
    `SELECT timestamp, TO_CHAR(timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as formatted_timestamp  FROM device_log ORDER BY id DESC LIMIT 1`
  );
  let lastTimestamp = result.rows.length
    ? result.rows[0].formatted_timestamp
    : null;
  let invalidLocation = result.rows[1];

  const timestamp = response[0].time;
  console.log(lastTimestamp);
  console.log(timestamp);

  if (timestamp !== lastTimestamp && invalidLocation !== 0) {
    const values = [
      response[0].data.Lat,
      response[0].data.Lon,
      response[0].data.Btn,
      response[0].time,
      "Harapan Jaya",
    ];

    // Query to fetch historical weather data from the node1 table
    const query = `INSERT INTO device_log (latitude,longitude,btn,timestamp,device_id) VALUES($1, $2, $3, $4, $5)`;

    // // Execute the query
    const result = await client.query(query, values);
    console.log("data berhasil di push");
    client.release();
    lastTimestamp = timestamp;
    return result;
  } else {
    console.log("Invalid To Push");
  }
}
setInterval(() => {
  savetodb();
}, 4000);

async function getAllData() {
  try {
    // Connect to PostgreSQL database
    const client = await pool.connect();

    // Query to fetch historical weather data from the node1 table
    // const query = "SELECT * FROM public.device_log";
    const query = "SELECT * FROM device_log ORDER BY id DESC";

    // Execute the query
    const result = await client.query(query);

    // Fetch the historical weather data
    const historicalData = result.rows;

    // Release the database connection
    client.release();

    return historicalData;
  } catch (error) {
    console.error(
      "Error fetching historical weather data from PostgreSQL:",
      error
    );
    throw error;
  }
}

async function getAllDanger() {
  try {
    // Connect to PostgreSQL database
    const client = await pool.connect();

    // Query to fetch historical weather data from the node1 table
    const query = "SELECT * FROM device_log WHERE btn = 1";

    // Execute the query
    const result = await client.query(query);

    // Fetch the historical weather data
    const historicalData = result.rows;

    // Release the database connection
    client.release();

    return historicalData;
  } catch (error) {
    console.error(
      "Error fetching historical weather data from PostgreSQL:",
      error
    );
    throw error;
  }
}

app.get("/ambil", async (req, res) => {
  try {
    // Fetch historical weather data from PostgreSQL
    const historicalData = await getAllData();

    // Send the historical weather data as JSON response
    res.json(historicalData);
  } catch (error) {
    console.error("Error fetching historical weather data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/getalldanger", async (req, res) => {
  try {
    // Fetch historical weather data from PostgreSQL
    const historicalData = await getAllDanger();

    // Send the historical weather data as JSON response
    res.json(historicalData);
  } catch (error) {
    console.error("Error fetching historical weather data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/danger", async (req, res) => {});

// Start the Express server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "postgres",
//   password: "ridho1382",
//   port: 5432,
// });
// app.post("/save", async (req, res) => {
//   try {
//     const apiUrl =
//       "https://api.qubitro.com/v2/projects/b9aabf51-edf2-4885-b211-8a424cb55208/devices/d0b022b0-a221-4599-82a7-9307c21fb97f/data?page=1&limit=1&range=all";

//     // Make GET request to Qubitro API
//     const response = await fetch(apiUrl, {
//       headers: {
//         Authorization: "Bearer QB_BzKTp5dhQP3--u1T9q1MYcpYJTO4reb4IY81Qax-",
//       },
//     })
//       .then((respon) => respon.json())
//       .then(({ data }) => data);

//     const result = savetodb(response[0]).then(() =>
//       console.log("Data saved to Node3 PostgreSQL successfully")
//     );
//     // Extract data from response

//     // Send the data as response
//     res.send(response[0]);
//   } catch (error) {
//     // Handle error if request fails
//     console.error("Error fetching data from Qubitro API:", error);
//     res.status(500).send("Error fetching data from Qubitro API");
//   }
// });
