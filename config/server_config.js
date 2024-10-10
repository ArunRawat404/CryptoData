const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    DB_URL: process.env.DB_URL,
    PORT: process.env.PORT,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY
};
