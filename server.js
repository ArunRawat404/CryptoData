const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

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

app.get('/stats', async (req, res) => {
    const { coin } = req.query;
    
    if (!coin) {
        return res.status(400).json({ error: 'Please provide a cryptocurrency using the "coin" query parameter.' });
    }
    
    try {
        const latestData = await Crypto.findOne().sort({ fetchedAt: -1 }).lean();
        
        if (!latestData || !latestData[coin]) {
            return res.status(404).json({ error: `No data found for ${coin}` });
        }
    
        return res.json(latestData[coin]);
    
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to calculate standard deviation
function calculateStandardDeviation(values) {
    const mean = values.reduce((acc, curr) => acc + curr, 0) / values.length;
    const variance = values.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
};

app.get('/deviation', async (req, res) => {
    const { coin } = req.query; 
    if (!coin) {
        return res.status(400).json({ error: 'Please specify a cryptocurrency using the "coin" query parameter.' });
    }

    try {
        const records = await Crypto.find().sort({ fetchedAt: -1 }).limit(100).lean();

        if (records.length === 0 || !records[0][coin]) {
            return res.status(404).json({ error: `No data found for ${coin}` });
        }
    
        const prices = records.map(record => record[coin].price);
    
        const stdDeviation = calculateStandardDeviation(prices);
    
        return res.json({ deviation: stdDeviation.toFixed(2) });

    } catch (error) {
        console.error('Error fetching data:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Schedule the job to run every 2 hours
async function scheduleCrons(){
    cron.schedule('0 */2 * * *', () => {
        console.log('Fetching crypto data...');
        fetchCryptoData();
    });
}

app.listen(PORT, async () => {
    console.log(`Server is up and running on PORT ${PORT}`);
    await connect();
    await scheduleCrons();
});
