require('dotenv').config();
const got = require('got').extend({ json: true, throwHttpErrors: false, agent: undefined });
const Chance = require('chance');
const delay = require('delay');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

const WRITES_PER_BATCH = parseInt(process.env.WRITES_PER_BATCH, 10) || 100;
const TOTAL_EVENTS = parseInt(process.env.TOTAL_EVENTS, 10) || 5e4;
const POOL_SIZE = parseInt(process.env.POOL_SIZE, 10) || 3;

const numOfRequests = ~~(TOTAL_EVENTS / WRITES_PER_BATCH);

const getRandomEvent = () => {
  const i = parseInt(Math.random() * 1000, 10);
  return { data: { a: i, b: i ** 2, c: i.toString() } };
};

const chance = new Chance();
const servers = chance.pickset([
  process.env.CENOTE_SERVER_1,
  process.env.CENOTE_SERVER_2,
  process.env.CENOTE_SERVER_3,
], POOL_SIZE);

const getRandomServer = () => { servers.push(servers.shift()); return servers[0]; };

const sendToCenote = async () => {
  const times = [];
  for (const i of Array(numOfRequests).keys()) { // eslint-disable-line no-unused-vars
    const startTime = Date.now();
    const body = { payload: getRandomEvent() };
    const baseUrl = getRandomServer();
    Promise.all([...Array(WRITES_PER_BATCH).keys()]
      .map(() => got.post(`/projects/${PROJECT_ID}/events/stresstest8?masterKey=${CENOTE_MASTER_KEY}`, { body, baseUrl }))
      .map(p => p.catch(e => e))).finally(() => {
      const totalTime = (Date.now() - startTime) / 1000;
      times.push(totalTime);
    });
    await delay(1000);
  }
  while (times.length !== numOfRequests) {
    await delay(250);
  }
  return times;
};

(async () => {
  try {
    const times = [];
    for (const i of Array(5).keys()) { // eslint-disable-line no-unused-vars
      const timesTmp = await sendToCenote();
      times.push(timesTmp.reduce((a, b) => a + b, 0) / timesTmp.length);
      console.log(times[times.length - 1]);
    }
    console.log(`Average (batch) response time with ${POOL_SIZE} servers and ${WRITES_PER_BATCH} batch size: ${
      times.reduce((a, b) => a + b, 0) / times.length}`);
  } catch (error) {
    console.error(error);
  }
})().then(() => console.log('Done!\n'));
