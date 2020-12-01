const got = require("got").extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });

const { PROJECT_ID, CENOTE_MASTER_KEY, EERIS_EVENT_COLLECTION } = process.env;
const { NUM_OF_DOCS } = global;

describe("Test /eeris route", () => {
	beforeAll(async () => {
		const query = {
			eventCollection: EERIS_EVENT_COLLECTION,
		};
		const response = await got.delete(`/projects/${PROJECT_ID}/queries/eerisTestCleanup`, { query });
		if (response.statusCode === 400) {
			expect(response.body.ok).toBe(false);
			expect(response.body.results).toBe("BadQueryError");
		} else {
			expect(response.statusCode).toBe(204);
		}
	}, 20 * 1000);

	test(`add ${NUM_OF_DOCS} measurements to collection ${EERIS_EVENT_COLLECTION}`, async () => {
		const payload = [];
		for (let i = 1; i < NUM_OF_DOCS + 1; i += 1) {
			payload.push({
				data: {
					active: i,
					b: i,
					c: i.toString(),
				},
				timestamp: Date.now(),
			});
		}
		const body = { payload };
		const response = await got.post(`/projects/${PROJECT_ID}/events/${EERIS_EVENT_COLLECTION}?masterKey=${CENOTE_MASTER_KEY}`, { body });
		expect(response.statusCode).toBe(202);
		expect(response.body.message).toBe("Events sent!");
		let count;
		const query = { masterKey: CENOTE_MASTER_KEY, event_collection: EERIS_EVENT_COLLECTION };
		while (!count) {
			({ count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query })).body.results[0]);
		}
		expect(count).toBe(NUM_OF_DOCS);
	}, 20 * 1000);

	test("query without specifying target_property property fails", async () => {
		const query = {
			masterKey: CENOTE_MASTER_KEY,
			event_collection: EERIS_EVENT_COLLECTION,
		};
		const response = await got.get(`/projects/${PROJECT_ID}/queries/eeris/historical`, { query });
		expect(response.statusCode).toBe(400);
		expect(response.body.ok).toBe(false);
		expect(response.body.results).toBe("TargetNotProvidedError");
	});

	test("query from collection ’blabla’ fails", async () => {
		const query = {
			masterKey: CENOTE_MASTER_KEY,
			event_collection: "blabla",
			target_property: "a",
		};
		const response = await got.get(`/projects/${PROJECT_ID}/queries/eeris/historical`, { query });
		expect(response.statusCode).toBe(400);
		expect(response.body.ok).toBe(false);
	});

	test("can calculate correct historical values (week)", async () => {
		// Calculate values to compare
		let sum = 0;
		for (let i = 1; i < NUM_OF_DOCS + 1; i += 1) sum += i;
		const avg = sum / NUM_OF_DOCS;
		// API query
		const query = {
			masterKey: CENOTE_MASTER_KEY,
			event_collection: EERIS_EVENT_COLLECTION,
			target_property: "active",
			type: "week",
		};
		const response = await got.get(`/projects/${PROJECT_ID}/queries/eeris/historical`, { query });

		expect(response.statusCode).toBe(200);
		expect(response.body.ok).toBe(true);
		expect(response.body.results.values.length).toBe(7);
		expect(response.body.results.values[6]).toBe(avg);
		expect(response.body.results.stats.avg).toBe(avg);
	});

	test("can calculate correct historical values (month)", async () => {
		// Calculate values to compare
		let sum = 0;
		for (let i = 1; i < NUM_OF_DOCS + 1; i += 1) sum += i;
		const avg = sum / NUM_OF_DOCS;
		// API query
		const query = {
			masterKey: CENOTE_MASTER_KEY,
			event_collection: EERIS_EVENT_COLLECTION,
			target_property: "active",
			type: "month",
		};
		const response = await got.get(`/projects/${PROJECT_ID}/queries/eeris/historical`, { query });
		expect(response.statusCode).toBe(200);
		expect(response.body.ok).toBe(true);
		expect(response.body.results.values.length).toBe(new Date().getDate());
		expect(response.body.results.values[new Date().getDate() - 1]).toBe(avg);
		expect(response.body.results.stats.avg).toBe(avg);
	});

	test("can calculate correct historical values (day)", async () => {
		// Calculate values to compare
		let sum = 0;
		for (let i = 1; i < NUM_OF_DOCS + 1; i += 1) sum += i;
		const avg = sum / NUM_OF_DOCS;
		// API query
		const year = new Date().getFullYear();
		const month = `0${new Date().getMonth() + 1}`.slice(-2);
		const day = `0${new Date().getDate()}`.slice(-2);
		const hours = new Date().getHours();
		const offsetCI = process.env.CI ? 3 : 0;
		const dateString = `${year}-${month}-${day}`;
		const query = {
			masterKey: CENOTE_MASTER_KEY,
			event_collection: EERIS_EVENT_COLLECTION,
			target_property: "active",
			type: "day",
			dt: dateString,
		};
		const response = await got.get(`/projects/${PROJECT_ID}/queries/eeris/historical`, { query });

		expect(response.statusCode).toBe(200);
		expect(response.body.ok).toBe(true);
		expect(response.body.results.values.length).toBe(24);
		expect(response.body.results.values[hours + offsetCI]).toBe(avg);
		expect(response.body.results.stats.avg).toBe(avg);
	});
});
