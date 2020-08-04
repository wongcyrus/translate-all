const AWS = require("aws-sdk");
const translate = new AWS.Translate();

exports.lambdaHandler = async (event, context) => {
  const key = event.srcKey;

  let segments = event.ContentType.split(".");
  let type = "";
  if (segments > 0) {
    type = segments[segments.length - 1];
  } else {
    segments = event.ContentType.split("/");
    type = segments[segments.length - 1];
  }
  const params = {
    DataAccessRoleArn: process.env.DataAccessRoleArn /* required */,
    InputDataConfig: {
      /* required */
      ContentType: event.ContentType /* required */,
      S3Uri: "s3://" + event.InputBucket + "/" + event.InputS3Uri,
    },
    OutputDataConfig: {
      S3Uri: "s3://" + event.OutputBucket + "/" + event.InputS3Uri,
    },
    SourceLanguageCode: event.SourceLanguageCode /* required */,
    TargetLanguageCodes: event.TargetLanguageCodes,
    JobName: event.JobName + "_" + type,
  };
  console.log(params);
  const result = await translate.startTextTranslationJob(params).promise();
  console.log(result);

  result.key = key;
  result.srcBucket = event.srcBucket;
  return result;
};
