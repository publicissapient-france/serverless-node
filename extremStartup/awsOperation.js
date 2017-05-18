'use strict';

const AWS = require('aws-sdk');
const sns = new AWS.SNS();
const s3 = new AWS.S3();

module.exports.snsPublish = (params, callback) => {
    sns.publish(params, (error, data) => {
        callback(error, data)
    });
}

module.exports.s3Push = (params, callback) => {
    s3.putObject(params, function (error, response) {
        if (!error) {
            console.log(`Successfully uploaded data to ${params.Bucket}/${params.Key}`);
            callback(true)
        } else {
            callback(false)
        }
    });
};

module.exports.s3FileExists = (params, callback) => {
    s3.headObject(params, (error, metadata) => {
        if (error && error.code === 'NotFound') {
            callback(false)
        } else {
            callback(true)
        }
    });
}
