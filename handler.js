'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); 
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

AWS.config.setPromisesDependency(require('bluebird'));

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.list = (event, context, callback) => {
  
  var params = {
        TableName: process.env.CANDIDATE_TABLE,
        ProjectionExpression: "id, fullname, gender"
    };

  console.log("Scanning Profile table.");
    const onScan = (err, data) => {

        if (err) {
            console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Scan succeeded.");
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    profiles: data.Items
                })
            });
        }

    };
    dynamoDb.scan(params, onScan);
};

module.exports.get = (event, context, callback) => {
  const params = {
    TableName: process.env.CANDIDATE_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  dynamoDb.get(params).promise()
    .then(result => {
      const response = {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error('Couldn\'t fetch profile.'));
      return;
    });
};

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const fullname = requestBody.fullname;
  const gender = requestBody.gender;
  const bio = requestBody.bio;
  const pingtime = requestBody.pingtime
  const birthdate = requestBody.birthdate
  const numofphotos = requestBody.numofphotos
  const latitude = requestBody.latitude
  const longitude = requestBody.longitude

  if (typeof fullname !== 'string' || typeof gender !== 'number' || typeof bio !== 'string') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t submit candidate because of validation errors.'));
    return;
  }

  submitCandidateP(candidateInfo(fullname, gender, bio, birthdate, pingtime, numofphotos, latitude, longitude))
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully submitted profile}`,
          candidateId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit profile`
        })
      })
    });
};

const submitCandidateP = candidate => {
  console.log('Submitting candidate');
  const candidateInfo = {
    TableName: process.env.CANDIDATE_TABLE,
    Item: candidate,
  };
  return dynamoDb.put(candidateInfo).promise()
    .then(res => candidate);
};

const candidateInfo = (fullname, gender, bio, birthdate, pingtime, numofphotos, latitude, longitude) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    fullname: fullname,
    gender: gender,
    bio: bio,
    birthdate: birthdate,
    pingtime: pingtime,
    numofphotos: numofphotos,
    longitude: longitude,
    latitude: latitude,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
};


module.exports.listimages = (event, context, callback) => {
  var params = {
    Bucket: 'playtindimage-store',  
  };
  s3.listObjectsV2(params, function(err, data) { 
    if (err) {
      console.log(err, err.stack);
    } else {
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          "bucket_list": data 
        }),
      };
      callback(null, response);
    }
  });
};

