const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });
const delay = require('delay');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

describe('Test writing functionality', () => {
  beforeAll(async () => {
    const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    await delay(5000);
    expect(response.statusCode).toBe(204);
  }, 10000);

  test('1000 new measurements should be written at most after 20 seconds.', async () => {
    const payload = [];
    for (let i = 1; i < 1001; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() } });
    const body = { payload };
    const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
    expect(response.statusCode).toBe(202);
    expect(response.body.length).toBe(1000);
    const query = { masterKey: CENOTE_MASTER_KEY, event_collection: 'test' };
    await delay(20000);
    const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query })).body.results[0];
    expect(count).toBe(1000);
  }, 22000);
});
