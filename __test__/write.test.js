const got = require("got").extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });
const delay = require("delay").createWithTimers({ clearTimeout, setTimeout });

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

describe("Test writing functionality", () => {
	beforeAll(async () => {
		const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
		if (response.statusCode === 400) {
			expect(response.body.ok).toBe(false);
			expect(response.body.results).toBe("BadQueryError");
		} else {
			expect(response.statusCode).toBe(204);
		}
	}, 20 * 1000);

	test("500 new measurements should be written at most after 10 seconds.", async () => {
		const payload = [];
		for (let i = 1; i < 501; i += 1) payload.push({ data: { a: i, b: i, c: i.toString() } });
		const body = { payload };
		const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
		expect(response.statusCode).toBe(202);
		expect(response.body.message).toBe("Events sent!");
		const query = { masterKey: CENOTE_MASTER_KEY, event_collection: "test" };
		await delay(10 * 1000);
		const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query })).body.results[0];
		expect(count).toBe(500);
	}, 30 * 1000);

	test("Writing to event collection with special characters in its name fails", async () => {
		const payload = [{ data: { a: 0, b: 0, c: (0).toString() } }];
		const body = { payload };
		const response = await got.post(`/projects/${PROJECT_ID}/events/t3St?masterKey=${CENOTE_MASTER_KEY}`, { body });
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toBe("InvalidCollectionNameError");
	});

	test("Writing events with special characters in their keys fails", async () => {
		const payload = [{ data: { a: 0, b: 0, c: { d: { e: { nApo: "66" } } } } }];
		const body = { payload };
		const response = await got.post(`/projects/${PROJECT_ID}/events/test?masterKey=${CENOTE_MASTER_KEY}`, { body });
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toBe("InvalidPropertyNameError");
	});
});
