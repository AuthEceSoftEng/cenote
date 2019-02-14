const supertest = require('supertest');
let request;

let WRITE_KEY; 
let READ_KEY; 
let PROJECT_ID;
let timestamp;

beforeAll(() => {
    request = supertest(process.env.CENOTE_API_URL);
    WRITE_KEY = process.env.CENOTE_WRITE_KEY;
    READ_KEY= process.env.CENOTE_READ_KEY;
    PROJECT_ID = process.env.PROJECT_ID;
    timestamp = Date.now();
});

test('Add 5 measurements', () => {
    return request.post(`/projects/${process.env.PROJECT_ID}/events/test?writeKey=${WRITE_KEY}`)
        .send({
            payload : [{
                data: {
                    current: 7.60,
                    voltage: 240,
                    note: "That's weird."
                },
                timestamp: timestamp + (0 * 1000)
            },{
                data: {
                    current: 7.9,
                    voltage: 239,
                    note: "That's weird."
                },
                timestamp: timestamp + (1 * 1000)
            },{
                data: {
                    current: 7.8,
                    voltage: 240.5,
                    note: "That's weird."
                },
                timestamp: timestamp + (2 * 1000)
            },{
                data: {
                    current: 7.57,
                    voltage: 241,
                    note: "That's weird."
                },
                timestamp: timestamp + (3 * 1000)
            },{
                data: {
                    current: 7.56,
                    voltage: 240.5,
                    note: "That's weird."
                },
                timestamp: timestamp + (4 * 1000)
            }]
        })
        .set('Accept', 'application/json')
        .expect(202)
        .then(response => {
            expect(response.body.length).toBe(5);
        })
  });

  test('Count 5 measurements', () => {
    return request.get(`/projects/${PROJECT_ID}/queries/count?event_collection=test&readKey=${READ_KEY}`)
        .set('Accept', 'application/json')
        .expect(200)
        .then(response => {
            console.log(response.body);
            expect(response.body.ok).toBe(true);
            expect(response.body.results[0].count).toBe(5);
        })
  });

  