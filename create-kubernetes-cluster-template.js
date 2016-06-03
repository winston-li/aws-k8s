#!/usr/bin/env node

var aws = require('./lib/aws_wrapper.js');

aws.create_cluster_template('./conf/cluster.yaml');

