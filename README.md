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

> Our demo server can be found [here](https://cenote.sidero.services/) along with the online [API docs](https://cenote.sidero.services/docs).

## Prerequisites

Before you can install cenote, you need to have already set up:

- A [zookeeper](https://zookeeper.apache.org/) instance/cluster which will be used to share configuration files between Apache's Kafka & Storm.
- A [kafka](https://kafka.apache.org/) instance/cluster with:
  - A topic for incoming messages (e.g. `cenoteIncoming`).
- A [storm](https://storm.apache.org) instance/cluster.
- A [cockroachDB](https://www.cockroachlabs.com/) instance/cluster with:
  - A DB for cenote to store its data (e.g. `cenote`)
  - A new user (e.g. `cockroach`) with all rights on the DB above.
- [Node.js](https://nodejs.org/en/) & [MongoDB](https://www.mongodb.com/) for the API server to run on.

## How to install on kubernetes

Every service should be deployed under the namespace cenote.
redis, cockroach, mongodb can be installed using the tiller-helm.
After that, the following services should be installed: zookeeper, storm, kafka, node.
Those services can be installed using its [yaml files](https://github.com/AuthEceSoftEng/cenote/tree/master/iac).

Login at your kubernetes cluster and execute the following commands:
```
kubectl create -f https://github.com/AuthEceSoftEng/cenote/tree/master/iac/zookeeperAlone.yaml
kubectl create -f https://github.com/AuthEceSoftEng/cenote/tree/master/iac/kafkaAll.yaml
kubectl create -f https://github.com/AuthEceSoftEng/cenote/tree/master/iac/nodejs.yaml
kubectl create -f https://github.com/AuthEceSoftEng/cenote/tree/master/iac/storm.yaml
kubectl create -f https://github.com/AuthEceSoftEng/cenote/tree/master/iac/storm2.yaml
kubectl create -f https://github.com/AuthEceSoftEng/cenote/tree/master/iac/storm3.yaml
```
**Attention!** Storm instances require the following IPs:
- Storm 1: 10.43.192.184
- Storm 2: 10.43.215.24
- Storm 3: 10.43.122.136

If you want to use different IPs, you have to rebuild the docker image.

## Cenote components

- The Apache Storm Topology used by cenote to write events to the database can be found [here](https://github.com/AuthEceSoftEng/cenote-write). You just need to clone the source code, configure a `.env` file and compile it to a jar that you will then submit to the Storm cluster. Instructions on how to do this can be found in the repo's README file.

  > Note: [cenote-write](https://github.com/AuthEceSoftEng/cenote-write) uses [cenote-cockroach](https://github.com/AuthEceSoftEng/cenote-cockroach) internally so check [cenote-cockroach@README](https://github.com/AuthEceSoftEng/cenote-cockroach/blob/master/README.md) for its required environment variables.

- The API server & UI used by cenote can be found [here](https://github.com/AuthEceSoftEng/cenote-api). You just need to clone the source code, configure a `.env` file and start it. Instructions on how to do this can be found in the repo's README file.

# Tests

To run the tests:

1. Configure a .env file.
2. Run `npm i`
3. Run `npm test`
