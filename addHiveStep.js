#!/usr/bin/env node

let AWS = require('aws-sdk');
const exec = require('child_process').exec;
let awsUtil = require('./awsUtil');

AWS.config.update({ region: 'us-east-1' });

let args = process.argv.slice(2);
//the first argument should be the stepName and 2nd be the hql file name;
let stepName = args[0];
let hqlFile = args[1];

const RC_CLUSTER_NAME = 'RC.HIVE.ADHOC';

Promise.all([awsUtil.getClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then((values) => {
    let clusterId = values[0];
    let bucketName = values[1];
    const env = awsUtil.getEnvFromBucketName(bucketName);
    const fileLocation = 's3://' + bucketName + '/RC/' + env + '/hive-scripts/' + hqlFile;
    let cmd = 'aws emr add-steps --cluster-id ' + clusterId + ' --steps Type=HIVE,Name="' + stepName + '",ActionOnFailure=CONTINUE,Args=[-f,' + fileLocation + ']';
    console.log(`Command to execute: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
});
