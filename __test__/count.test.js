const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });
const delay = require('delay');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;
const { NUM_OF_DOCS } = global;

describe('Test /count route', () => {
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

  test(`add ${NUM_OF_DOCS} measurements to collection 'test' ( and wait ${Math.trunc(NUM_OF_DOCS / 5)} seconds )`, async () => {
    const payload = [];
    for (let i = 0; i < NUM_OF_DOCS; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() } });
    const body = { payload };
    const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
    await delay(NUM_OF_DOCS * 200);
    expect(response.statusCode).toBe(202);
    expect(response.body.length).toBe(NUM_OF_DOCS);
  }, NUM_OF_DOCS * 400);

  test(`count ${NUM_OF_DOCS} measurements from collection 'test'`, async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].count).toBe(NUM_OF_DOCS + 1);
  });

  test('count from collection \'blabla\' fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test(`count ${NUM_OF_DOCS} measurements from collection 'test' with existing target_property property`, async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].count).toBe(NUM_OF_DOCS + 1);
  });

  test('count from collection \'test\' with non-existing target_property property falls back to *', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].count).toBe(NUM_OF_DOCS + 1);
  });

  test(`count latest 10 of ${NUM_OF_DOCS} measurements`, async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      latest: 10,
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].count).toBe(NUM_OF_DOCS + 1);
  });

  test(`count latest 100 of ${NUM_OF_DOCS} measurements returns all existing`, async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      latest: 10,
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].count).toBe(NUM_OF_DOCS + 1);
  });

  test(`count ${NUM_OF_DOCS} measurements with existing group_by property`, async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      group_by: 'c',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results.length).toBe(NUM_OF_DOCS + 1);
    response.body.results.forEach(res => expect(Object.keys(res)).toEqual(['c', 'count']));
  });

  test('count measurements with non-existing group_by property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      group_by: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test(`count ${NUM_OF_DOCS} measurements with specific interval property`, async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      interval: 'minutely',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].interval).toBeDefined();
    expect(response.body.results[0].result).toBeDefined();
  });

  test('count measurements with invalid interval property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      interval: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/count`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.err).toBeDefined();
  });
});
