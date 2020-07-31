const AWS = require("aws-sdk");
const crypto = require("crypto");
const translate = new AWS.Translate();

exports.lambdaHandler = async (event, context) => {
  const bucket = process.env["InputBucket"];
  const key = event.srcKey;

  const params = {
    DataAccessRoleArn: process.env.DataAccessRoleArn /* required */,
    InputDataConfig: {
      /* required */
      ContentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" /* required */,
      S3Uri: "s3://" + event.InputBucket + "/" + event.InputS3Uri,
    },
    OutputDataConfig: {
      S3Uri: "s3://" + event.OutputBucket + "/" + event.InputS3Uri,
    },
    SourceLanguageCode: event.SourceLanguageCode /* required */,
    TargetLanguageCodes: event.TargetLanguageCodes,
    JobName: event.JobName,
  };
  console.log(params);
  const result = await translate.startTextTranslationJob(params).promise();
  console.log(result);

  result.key = key;
  result.srcBucket = event.srcBucket;
  return result;
};
