/* eslint-disable no-await-in-loop, no-restricted-syntax, no-bitwise */
const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false, agent: undefined });
const delay = require('delay');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

module.exports = async (eventCollection, totalEvents) => {
  const startTime = Date.now();
  const query = { masterKey: CENOTE_MASTER_KEY, event_collection: eventCollection };
  for (const _ of Array(totalEvents).keys()) { // eslint-disable-line no-unused-vars
    const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query })).body.results[0];
    if (count >= totalEvents) {
      const totalTime = (Date.now() - startTime) / 1000;
      return totalTime;
    }
    await delay(500);
  }
  return null;
};
