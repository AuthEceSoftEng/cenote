require("dotenv").config();
const got = require("got").extend({ json: true, throwHttpErrors: false, agent: undefined });

const measureWriteTime = require("./measureWriteTime");

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

const WRITES_PER_BATCH = parseInt(process.env.WRITES_PER_BATCH, 10) || 100;
const TOTAL_EVENTS = parseInt(process.env.TOTAL_EVENTS, 10) || 5e4;

const numOfRequests = ~~(TOTAL_EVENTS / WRITES_PER_BATCH);

const getRandomEvent = () => {
	const i = parseInt(Math.random() * 1000, 10);
	return { data: { a: i, b: i ** 2, c: i.toString() } };
};

const sendToCenote = async () => {
	const baseUrl = process.env.CENOTE_API_URL;
	const times = [];
	const query = { masterKey: CENOTE_MASTER_KEY, event_collection: "stresstest8" };
	const { count } = (await got.get(`/projects/${PROJECT_ID}/queries/count`, { query, baseUrl })).body.results[0];
	const event = getRandomEvent();
	for (const i of new Array(numOfRequests).keys()) {
		const payload = [];
		for (let j = 0; j < WRITES_PER_BATCH; j += 1) payload.push(event);
		await got.post(`/projects/${PROJECT_ID}/events/stresstest8?masterKey=${CENOTE_MASTER_KEY}`, { body: { payload }, baseUrl });
		times.push(await measureWriteTime("stresstest8", (count || 0) + (i + 1) * WRITES_PER_BATCH));
	}
	return times;
};

(async () => {
	try {
		const times = [];
		for (const i of new Array(5).keys()) { // eslint-disable-line no-unused-vars
			const timesTmp = await sendToCenote();
			times.push(timesTmp.reduce((a, b) => a + b, 0) / timesTmp.length);
			console.log(times[times.length - 1]);
		}
		console.log(`Average (batch) time to DB with ${WRITES_PER_BATCH} batch size: ${times.reduce((a, b) => a + b, 0) / times.length}`);
	} catch (error) {
		console.error(error);
	}
})().then(() => console.log("Done!\n"));
