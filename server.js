const express = require('express');

const { PORT } = require("./config/server_config");
const connect = require("./config/db_config");

const app = express();

app.use(express.json());

app.listen(PORT, async () => {
    console.log(`Server is up and running on PORT ${PORT}`);
    await connect();
});
