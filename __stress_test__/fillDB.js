/* eslint-disable no-await-in-loop, no-restricted-syntax, no-bitwise */
require('dotenv').config();
const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false, agent: undefined });

const measureWriteTime = require('./measureWriteTime');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

const TOTAL_EVENTS = 3e4;
const WRITES_PER_POST = Math.min(parseInt(process.env.WRITES_PER_BATCH, 10) || 1e4, TOTAL_EVENTS);

const numOfRequests = ~~(TOTAL_EVENTS / WRITES_PER_POST);

const getRandomEvent = () => {
  const i = parseInt(Math.random() * 1000, 10);
  return { data: { a: i, b: i ** 2, c: i.toString() } };
};

const sendToCenote = async () => {
  const times = [];
  const query = { masterKey: CENOTE_MASTER_KEY, event_collection: 'stresstest' };
  const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query })).body.results[0];
  for (const i of Array(numOfRequests).keys()) {
    const payload = [];
    for (let j = 0; j < WRITES_PER_POST; j += 1) payload.push(getRandomEvent());
    const body = { payload };
    const batchPromise = got.post(`/projects/${PROJECT_ID}/events/stresstest?masterKey=${CENOTE_MASTER_KEY}`, { body });
    const res = await Promise.all([measureWriteTime('stresstest', count + (i + 1) * WRITES_PER_POST), batchPromise]);
    times.push(res[0]);
  }
  return times;
};

(async () => {
  try {
    const times = await sendToCenote();
    console.log(`Took an average ${(times.reduce((prev, cur) => prev + cur, 0) / times.length).toFixed(2)} seconds to write ${
      WRITES_PER_POST} events.`);
    console.log(`Time per batch: ${times}`);
  } catch (error) {
    console.error(error);
  }
})().then(() => console.log('Done!'));
