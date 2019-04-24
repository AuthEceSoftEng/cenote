/* eslint-disable no-await-in-loop, no-restricted-syntax, no-bitwise */
require('dotenv').config();
const got = require('got').extend({ json: true, throwHttpErrors: false, agent: undefined });
const delay = require('delay');
const Chance = require('chance');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;
const POOL_SIZE = parseInt(process.env.POOL_SIZE, 10) || 3;
const chance = new Chance(666);
const servers = chance.pickset([
  process.env.CENOTE_SERVER_1,
  process.env.CENOTE_SERVER_2,
  process.env.CENOTE_SERVER_3,
], POOL_SIZE);

const getRandomServer = () => chance.pickone(servers);

module.exports = async (eventCollection, totalEvents) => {
  const startTime = Date.now();
  const query = { masterKey: CENOTE_MASTER_KEY, event_collection: eventCollection };
  for (const _ of Array(totalEvents).keys()) { // eslint-disable-line no-unused-vars
    const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query, baseUrl: getRandomServer() })).body.results[0];
    if (count >= totalEvents) {
      const totalTime = (Date.now() - startTime) / 1000;
      return totalTime;
    }
    await delay(500);
  }
  return null;
};
