const express = require('express');
const axios = require('axios');

const { PORT, COINGECKO_API_KEY } = require("./config/server_config");
const connect = require("./config/db_config");
const Crypto = require('./models/cryptoData'); 

const app = express();

app.use(express.json());

const vsCurrency = "usd"
const currencies = ["bitcoin", "ethereum", "matic-network"];

// currencies array into a string, separating each currency by a comma
const currenciesQuery = currencies.join(',');

const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&ids=${currenciesQuery}`;

async function fetchCryptoData() {
    try {
        const options = {
            method: 'GET',
            headers: {accept: 'application/json', 'x-cg-demo-api-key': COINGECKO_API_KEY}
        };

        const response = await axios.get(url, options); 

        const bitcoin = response.data.find(coin => coin.id === 'bitcoin');
        const ethereum = response.data.find(coin => coin.id === 'ethereum');
        const matic = response.data.find(coin => coin.id === 'matic-network');

        const cryptoData = {
            bitcoin: {
                price: bitcoin.current_price,
                marketCap: bitcoin.market_cap,
                "24hChange": bitcoin.price_change_percentage_24h,
            },
            ethereum: {
                price: ethereum.current_price,
                marketCap: ethereum.market_cap,
                "24hChange": ethereum.price_change_percentage_24h,
            },
            matic: {
                price: matic.current_price,
                marketCap: matic.market_cap,
                "24hChange": matic.price_change_percentage_24h,
            }
        };

        await saveCryptoData(cryptoData); 

        console.log('Crypto data updated successfully');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function saveCryptoData(cryptoData) {
    try {
        const newEntry = new Crypto({
            bitcoin: cryptoData.bitcoin,
            ethereum: cryptoData.ethereum,
            matic: cryptoData.matic,
            fetchedAt: new Date(),
        });
    
        await newEntry.save();
        console.log('Data saved to database');
        } catch (error) {
        console.error('Error saving data to the database:', error.message);
    }
};

app.listen(PORT, async () => {
    console.log(`Server is up and running on PORT ${PORT}`);
    await connect();
    fetchCryptoData();
});
