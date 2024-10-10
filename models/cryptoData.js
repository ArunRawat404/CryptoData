const mongoose = require('mongoose');

const cryptoSchema = new mongoose.Schema({
    bitcoin: {
        price: Number,
        marketCap: Number,
        "24hChange": Number,
    },
    ethereum: {
        price: Number,
        marketCap: Number,
        "24hChange": Number,
    },
    matic: {
        price: Number,
        marketCap: Number,
        "24hChange": Number,
    },
    fetchedAt: { type: Date, default: Date.now },
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

module.exports = Crypto;
