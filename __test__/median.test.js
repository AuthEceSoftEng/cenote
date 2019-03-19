const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });
const delay = require('delay');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;
const { NUM_OF_DOCS } = global;

const median = (arr) => {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  return arr[Math.ceil(arr.length / 2) - 1];
};

describe('Test /median route', () => {
  beforeAll(async () => {
    const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    expect(response.statusCode).toBe(204);
    const theFirst = { payload: { data: { a: -1, b: -1, c: (-1).toString() } } };
    const response2 = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body: theFirst });
    expect(response2.statusCode).toBe(202);
    expect(response2.body.length).toBe(1);
    await delay(2000);
  });

  afterAll(async () => {
    const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    expect(response.statusCode).toBe(204);
  });

  test(`add ${NUM_OF_DOCS} measurements to collection 'test' ( and wait ${Math.trunc(NUM_OF_DOCS / 7)} seconds )`, async () => {
    const payload = [];
    for (let i = 0; i < NUM_OF_DOCS; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() } });
    const body = { payload };
    const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
    await delay(NUM_OF_DOCS * 200);
    expect(response.statusCode).toBe(202);
    expect(response.body.length).toBe(NUM_OF_DOCS);
  }, NUM_OF_DOCS * 400);

  test('query without specifying target_property property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.results).toBe('TargetNotProvidedError');
  });

  test('query from collection \'blabla\' fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'blabla',
      target_property: 'a',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('can calculate correct median value', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].median).toBe(median((n => [...Array(n).keys()])(NUM_OF_DOCS).concat(-1)));
  });

  test('query measurements with existing group_by property', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      group_by: 'c',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results.length).toBe(NUM_OF_DOCS + 1);
    response.body.results.forEach(res => expect(Object.keys(res)).toEqual(['c', 'median']));
  });

  test('query measurements with non-existing group_by property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      group_by: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('query measurements with specific interval property', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      interval: 'minutely',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].interval).toBeDefined();
    expect(response.body.results[0].result).toBeDefined();
  });

  test('query measurements with invalid interval property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      interval: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.err).toBeDefined();
  });
});
