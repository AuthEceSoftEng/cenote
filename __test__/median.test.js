const got = require('got').extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;
const { NUM_OF_DOCS } = global;

const median = (arr) => {
  if (arr.length === 0) return null;
  arr.sort((a, b) => a - b);
  return arr[Math.ceil(arr.length / 2) - 1];
};

describe('Test /median route', () => {
  beforeAll(async () => {
    const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    if (response.statusCode === 400) {
      expect(response.body.ok).toBe(false);
      expect(response.body.results).toBe('BadQueryError');
    } else {
      expect(response.statusCode).toBe(204);
    }
  }, 15 * 1000);

  test(`add ${NUM_OF_DOCS} measurements to collection 'test'`, async () => {
    const payload = [];
    for (let i = 1; i < NUM_OF_DOCS + 1; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() } });
    const body = { payload };
    const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
    expect(response.statusCode).toBe(202);
    expect(response.body.message).toBe('Events sent!');
    let count;
    const query = { masterKey: CENOTE_MASTER_KEY, event_collection: 'test' };
    while (!count) {
      ({ count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query })).body.results[0]);
    }
    expect(count).toBe(NUM_OF_DOCS);
  }, 30 * 1000);

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
    expect(response.body.results[0].median).toBe(median((n => [...Array(n).keys()])(NUM_OF_DOCS + 1).slice(1)));
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
    expect(response.body.results.length).toBe(NUM_OF_DOCS);
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
    expect(response.body.results).toBeDefined();
  });

  test('query measurements with filter property (1)', async () => {
    const query = {
      masterKey: CENOTE_MASTER_KEY,
      event_collection: 'test',
      target_property: 'a',
      filters: JSON.stringify([{ property_name: 'a', operator: 'gte', property_value: (NUM_OF_DOCS / 2) }]),
    };
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].median).toBe(median((n => [...Array(n).keys()])(NUM_OF_DOCS + 1).slice(Math.ceil(NUM_OF_DOCS / 2))));
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
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].median).toBe(NUM_OF_DOCS);
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
    const response = await got.get(`/projects/${PROJECT_ID}/queries/median`, { query });
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].median).toBe(0);
  });
});
