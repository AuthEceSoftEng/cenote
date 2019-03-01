require('dotenv').load();
const request = require('supertest')(process.env.CENOTE_API_URL);
const delay = require('delay');

const { PROJECT_ID, CENOTE_WRITE_KEY, CENOTE_READ_KEY } = process.env;
const NUM_OF_DOCS = 15;

describe('Adding documents', () => {
  beforeAll(async () => {
    const response = await request.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    expect(response.status).toBe(204);
  });

  afterAll(async () => {
    const response = await request.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
    expect(response.status).toBe(204);
  });

  test(`Add ${NUM_OF_DOCS} measurements`, async () => {
    const payload = [];
    for (let i = 0; i < NUM_OF_DOCS; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() }, timestamp: Date.now() });
    const response = await request.post(`/projects/${PROJECT_ID}/events/test?writeKey=${CENOTE_WRITE_KEY}`).send({ payload });
    expect(response.status).toBe(202);
    expect(response.body.length).toBe(NUM_OF_DOCS);
  });

  test(`Count ${NUM_OF_DOCS} measurements (after 3 seconds)`, async () => {
    await delay(3000);
    const response = await request.get(`/projects/${PROJECT_ID}/queries/count?event_collection=test&readKey=${CENOTE_READ_KEY}`);
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.results[0].count).toBe(NUM_OF_DOCS);
  }, 35000);
});
