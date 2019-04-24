/* eslint-disable no-await-in-loop, no-restricted-syntax, no-bitwise */
require('dotenv').config();
const got = require('got').extend({ json: true, throwHttpErrors: false, agent: undefined });
const Chance = require('chance');

const measureWriteTime = require('./measureWriteTime');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

const WRITES_PER_BATCH = parseInt(process.env.WRITES_PER_BATCH, 10) || 100;
const TOTAL_EVENTS = 5e4;
const POOL_SIZE = parseInt(process.env.POOL_SIZE, 10) || 3;

const numOfRequests = ~~(TOTAL_EVENTS / WRITES_PER_BATCH);

const getRandomEvent = () => {
  const i = parseInt(Math.random() * 1000, 10);
  return { data: { a: i, b: i ** 2, c: i.toString() } };
};

const chance = new Chance(666);
const servers = chance.pickset([
  process.env.CENOTE_SERVER_1,
  process.env.CENOTE_SERVER_2,
  process.env.CENOTE_SERVER_3,
], POOL_SIZE);

const getRandomServer = () => chance.pickone(servers);

const sendToCenote = async () => {
  const times = [];
  const query = { masterKey: CENOTE_MASTER_KEY, event_collection: 'stresstest' };
  const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query, baseUrl: getRandomServer() })).body.results[0];
  for (const i of Array(numOfRequests).keys()) {
    const eventPromises = [];
    for (let j = 0; j < WRITES_PER_BATCH; j += 1) {
      const body = { payload: getRandomEvent() };
      eventPromises.push(got.post(`/projects/${PROJECT_ID}/events/stresstest?masterKey=${CENOTE_MASTER_KEY}`, { body, baseUrl: getRandomServer() }));
    }
    const res = await Promise.all([measureWriteTime('stresstest', count + (i + 1) * WRITES_PER_BATCH), ...eventPromises]);
    times.push(res[0]);
  }
  return times;
};

(async () => {
  try {
    const times = await sendToCenote();
    console.log(`Time per batch: ${times}`);
    console.log(`Average response (batch) response time with ${POOL_SIZE} servers: ${times.reduce((a, b) => a + b, 0) / times.length}`);
  } catch (error) {
    console.error(error);
  }
})().then(() => console.log('Done!\n'));
