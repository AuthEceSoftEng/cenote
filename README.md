![cenote](./Cenote_colour_Horizontal.png)

[![Travis](https://img.shields.io/travis/com/AuthEceSoftEng/cenote.svg?style=flat-square&logo=travis&label=)](https://travis-ci.com/AuthEceSoftEng/cenote) [![license](https://img.shields.io/github/license/AuthEceSoftEng/cenote.svg?style=flat-square)](./LICENSE)

[cenote](https://en.wikipedia.org/wiki/Cenote) (Katavothra) is a Big Data Management System (BDMS) for event processing and analytics. Our goal was to build an open source equivalent of [keen.io](http://keen.io) analytics and learn about scalable systems in the process. The technology stack is based on:

- Kafka
- Storm
- CockroachDB
- MERN stack

and inludes code from programming languages JavaScript, Java and Python.

This is the logistics repository to hold issues, documentation, installation instructions and any code that is across cenote systems.

# Repositories

Since cenote is a distributed system it spans across 5 repositories:

- [cenote](https://github.com/AuthEceSoftEng/cenote): This one, used for gathering all the issues related to cenote, hosting IaC files and containing installation instructions.
- [cenote-api](https://github.com/AuthEceSoftEng/cenote-api): API server & web management client, used also for data reading.
- [cenote-cockroach](https://github.com/AuthEceSoftEng/cenote-cockroach): Read/Write related code for CockroachDB.
- [cenote-write](https://github.com/AuthEceSoftEng/cenote-write): Apache Storm topology used for data writing.
- [cenote-read](https://github.com/AuthEceSoftEng/cenote-read): Apache Storm Topology used for querying data. (Obsolete, due to latencies in DRPC server, switched the reading to cenote-api).

# Installation

Our (staging) demo server can be found [here](https://cenote.sidero.services/) along with the online [API docs](https://cenote.sidero.services/docs). *NB: Do not store operational data there...they will be lost.*

# Tests

To run the tests:

1. Configure a .env file.
2. Run `npm i`
3. Run `npm test`
