require('dotenv').config();

global.NUM_OF_DOCS = parseInt(process.env.NUM_OF_DOCS, 10) || 100;
