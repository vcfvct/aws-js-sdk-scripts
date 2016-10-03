#!/usr/bin/env node

let AWS = require('aws-sdk');
let awsUtil = require('./lib/awsUtil');

AWS.config.update({ region: 'us-east-1' });

let emr = new AWS.EMR();

let args = process.argv.slice(2);
//the first argument should be the notify email and 2nd be the ELB name to be binded;
let notifyEmail = args[0];
let elbName = arg[1];

const RC_CLUSTER_NAME = 'RC.HIVE.ADHOC';


Promise.all([awsUtil.getStartingOrActiveClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then(
    (values) => {
        let clusterId = values[0];
        let bucketName = values[1];
        if (clusterId) {
            console.log(`Cluster ${RC_CLUSTER_NAME} already exist! Quit`);
        } else {
            const env = awsUtil.getEnvFromBucketName(bucketName);
            return awsUtil.createCluster(RC_CLUSTER_NAME);
        }
    }).then(
    (newClusterId) => {
        if (newClusterId) {
            console.log(`New cluster created, ID: ${newClusterId}`);
            sendBeginEmail(newClusterId);
            let waitCluster = setInterval(() => {
                awsUtil.getActiveClusterId(RC_CLUSTER_NAME).then((cid) => {
                    if (cid) {
                        clearInterval(waitCluster);
                        //TODO (1)listInstances to get the master node instance ID (2)use elb API to register-instances-with-load-balancer for the master. 
                    }
                })
            }, 30000);
        }
    });


function sendBeginEmail(clusterId) {
    const exec = require('child_process').exec;
    let mailxCMD = 'echo clusterId: ' + clusterId + ' | mailx -s "Report Center Creation Status" ' + notifyEmail;
    console.log(`Trying to send email out with cmd: ${mailxCMD}`);

    exec(mailxCMD, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}
