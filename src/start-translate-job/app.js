const AWS = require("aws-sdk");
const translate = new AWS.Translate();
const s3 = new AWS.S3();

exports.lambdaHandler = async (event, context) => {
  const mapping = {
    "text/plain": "/plain/",
    "text/html": "/html/",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "/document/",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "/presentation/",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "/sheet/",
  };
  const folder = mapping[event.ContentType];

  //Create empty folder
  await s3
    .putObject({
      ContentLength: 0,
      Bucket: event.OutputBucket,
      Key: event.InputS3Uri + folder,
    })
    .promise();

  const params = {
    DataAccessRoleArn: process.env.DataAccessRoleArn /* required */,
    InputDataConfig: {
      /* required */
      ContentType: event.ContentType /* required */,
      S3Uri: "s3://" + event.InputBucket + "/" + event.InputS3Uri + folder,
    },
    OutputDataConfig: {
      S3Uri: "s3://" + event.OutputBucket + "/" + event.InputS3Uri + folder,
    },
    SourceLanguageCode: event.SourceLanguageCode /* required */,
    TargetLanguageCodes: event.TargetLanguageCodes,
    JobName: event.JobName + "_" + event.ContentType,
  };
  console.log(params);
  const result = await translate.startTextTranslationJob(params).promise();
  console.log(result);

  params.JobId = result.key;
  params.JobStatus = result.JobStatus;
  return params;
};
