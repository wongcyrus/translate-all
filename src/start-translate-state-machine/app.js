const AWS = require("aws-sdk");
const stepfunctions = new AWS.StepFunctions();
const moment = require("moment");
const crypto = require("crypto");

exports.lambdaHandler = async (event, context) => {
  console.log(event);

  const params = {
    stateMachineArn: process.env.TranslateStateMachine,
    /* required */
    input: JSON.stringify({
      JobName: "testing",
      InputBucket: process.env.InputBucket,
      InputS3Uri: "test/",
      OutputBucket: process.env.OutputBucket,
      SourceLanguageCode: "en",
      TargetLanguageCodes: ["zh-TW"],
    }),
    name:
      moment().format("MMMM-Do-YYYY-h-mm-ss-a") +
      "-" +
      crypto.createHash("md5").update("key").digest("hex"),
  };
  const result = await stepfunctions.startExecution(params).promise();

  return result;
};
