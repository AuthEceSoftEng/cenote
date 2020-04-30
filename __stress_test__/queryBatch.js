require("dotenv").config();
const got = require("got").extend({ json: true, throwHttpErrors: false, agent: undefined });
const Chance = require("chance");
const delay = require("delay").createWithTimers({ clearTimeout, setTimeout });

const { PROJECT_ID, CENOTE_MASTER_KEY } = process.env;

const READS_PER_BATCH = parseInt(process.env.READS_PER_BATCH, 10) || 100;
const POOL_SIZE = parseInt(process.env.POOL_SIZE, 10) || 3;

const numOfRequests = 1;

const chance = new Chance();
const servers = chance.pickset([
	process.env.CENOTE_SERVER_1,
	process.env.CENOTE_SERVER_2,
	process.env.CENOTE_SERVER_3,
], POOL_SIZE);

const getRandomServer = () => { servers.push(servers.shift()); return servers[0]; };

const sendToCenote = async () => {
	const times = [];
	const query = {
		masterKey: CENOTE_MASTER_KEY,
		event_collection: "stresstest8",
		target_property: "a",
		outliers: "include",
		outliers_in: "a",
	};
	for (const i of new Array(numOfRequests).keys()) { // eslint-disable-line no-unused-vars
		const startTime = Date.now();
		Promise.all([...new Array(READS_PER_BATCH).keys()]
			.map(() => got.get(`/projects/${PROJECT_ID}/queries/sum`, { query, baseUrl: getRandomServer() }))
			.map((p) => p.catch((error) => error)))
			.finally(() => {
				const totalTime = (Date.now() - startTime) / 1000;
				times.push(totalTime);
			});
	}
	while (times.length !== numOfRequests) {
		await delay(250);
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
		console.log(`Average (batch) response time with ${POOL_SIZE} servers and ${READS_PER_BATCH
		} batch size: ${times.reduce((a, b) => a + b, 0) / times.length}`);
	} catch (error) {
		console.error(error);
	}
})().then(() => console.log("Done!\n"));
