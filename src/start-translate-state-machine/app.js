const AWS = require("aws-sdk");
const stepfunctions = new AWS.StepFunctions();
const moment = require("moment");
const crypto = require("crypto");

exports.lambdaHandler = async (event, context) => {
  console.log(event);

  const results = await Promise.all(
    event.Records.map(async (record) => {
      const { body } = record;
      //     {
      //   "JobName": "testing",
      //   "InputBucket": "translate-all-documents-inputbucket-1o4w2zo6guqpd",
      //   "InputS3Uri": "test",
      //   "OutputBucket": "translate-all-documents-outputbucket-uqy3mw10t859",
      //   "SourceLanguageCode": "en",
      //   "TargetLanguageCodes": [
      //     "zh-TW"
      //   ]
      // }
      const params = {
        stateMachineArn: process.env.TranslateStateMachine,
        /* required */
        input: body,
        name:
          moment().format("MMMM-Do-YYYY-h-mm-ss-a") +
          "-" +
          crypto.createHash("md5").update("key").digest("hex"),
      };
      const result = await stepfunctions.startExecution(params).promise();
      console.log(body);
      return result;
    })
  );

  return results;
};
