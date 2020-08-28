require("dotenv").config();
const got = require("got").extend({ baseUrl: process.env.CENOTE_API_URL, json: true, throwHttpErrors: false });

global.NUM_OF_DOCS = parseInt(process.env.NUM_OF_DOCS, 10) || 100;

const { PROJECT_ID } = process.env;

beforeAll(async () => {
	const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
	if (response.statusCode === 400) {
		expect(response.body.ok).toBe(false);
		expect(response.body.results).toBe("BadQueryError");
	} else {
		expect(response.statusCode).toBe(204);
	}
}, 20 * 1000);

afterAll(async () => {
	const response = await got.delete(`/projects/${PROJECT_ID}/queries/testCleanup`);
	if (response.statusCode === 400) {
		expect(response.body.ok).toBe(false);
		expect(response.body.results).toBe("BadQueryError");
	} else {
		expect(response.statusCode).toBe(204);
	}
}, 20 * 1000);
