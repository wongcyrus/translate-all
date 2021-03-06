const AWS = require("aws-sdk");
const translate = new AWS.Translate();

exports.lambdaHandler = async (event, context) => {
  console.log(JSON.stringify(event));
  let params = {
    JobId: event.JobId,
  };

  const job = await translate.describeTextTranslationJob(params).promise();

  console.log(job);

  if (job.TextTranslationJobProperties.JobStatus === "COMPLETED") {
    event.iterator.continue = false;
  }
  event.JobStatus = job.TextTranslationJobProperties.JobStatus;
  event.JobName = job.TextTranslationJobProperties.JobName;

  return event;
};
