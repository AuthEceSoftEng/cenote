const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });
const delay = require('delay');

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;
const { NUM_OF_DOCS } = global;

describe('Test /average route', () => {
  beforeAll(async () => {
    const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    await delay(5000);
    if (response.statusCode === 400) {
      expect(response.body.ok).toBe(false);
      expect(response.body.err).toBe(`relation "${PROJECT_ID}_test" does not exist`);
    } else {
      expect(response.statusCode).toBe(204);
    }
  }, 10000);

  test(`add ${NUM_OF_DOCS} measurements to collection 'test' ( and wait ${Math.trunc(NUM_OF_DOCS / 3)} seconds )`, async () => {
    const payload = [];
    for (let i = 1; i < NUM_OF_DOCS + 1; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() } });
    const body = { payload };
    const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
    await delay(NUM_OF_DOCS * 300);
    expect(response.statusCode).toBe(202);
    expect(response.body.message).toBe('Events sent!');
  }, NUM_OF_DOCS * 400);

  test('query without specifying target_property property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
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
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('can calculate correct average value', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].avg).toBe((NUM_OF_DOCS + 1) / 2);
  });

  test('query measurements with existing group_by property', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      group_by: 'c',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results.length).toBe(NUM_OF_DOCS);
    response.body.results.forEach(res => expect(Object.keys(res)).toEqual(['c', 'avg']));
  });

  test('query measurements with non-existing group_by property fails', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      group_by: 'blabla',
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
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
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
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
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.err).toBeDefined();
  });

  test('query measurements with filter property (1)', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      filters: JSON.stringify([{ property_name: 'a', operator: 'gte', property_value: (NUM_OF_DOCS / 2) }]),
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].avg).toBe(3 * NUM_OF_DOCS / 4);
  });

  test('query measurements with filter property (2)', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      filters: JSON.stringify([
        { property_name: 'a', operator: 'eq', property_value: NUM_OF_DOCS },
        { property_name: 'b', operator: 'eq', property_value: NUM_OF_DOCS },
      ]),
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].avg).toBe(NUM_OF_DOCS);
  });

  test('query measurements with filter property (3)', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      filters: JSON.stringify([
        { property_name: 'a', operator: 'eq', property_value: NUM_OF_DOCS },
        { property_name: 'b', operator: 'eq', property_value: NUM_OF_DOCS - 1 },
      ]),
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/average`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].avg).toBe(null);
  });
});
