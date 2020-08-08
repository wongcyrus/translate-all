const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3();

exports.lambdaHandler = async (event, context) => {
  //event.InputBucket + "/" + event.InputS3Uri
  const mappingContenType = {
    "text/plain": [".txt"],
    "text/html": [".html", ".xml"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
      ".pptx",
    ],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
  };

  const folderMapping = {
    "text/plain": "/!!plain!!/",
    "text/html": "/!!html!!/",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "/!!document!!/",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "/!!presentation!!/",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "/!!sheet!!/",
  };

  const awsAccountId = context.invokedFunctionArn.split(":")[4];
  const distKeys = await Promise.all(
    await event.map(async (job) => {
      const resultFolder =
        job.OutputDataConfig.S3Uri +
        awsAccountId +
        "-TranslateText-" +
        job.JobId;

      const outputBucket = resultFolder.split("/")[2];
      const jobFolder = awsAccountId + "-TranslateText-" + job.JobId;
      const prefix = resultFolder.substring(
        ("s3://" + outputBucket).length + 1
      );
      const params = {
        Bucket: outputBucket /* required */,
        Prefix: prefix,
      };
      const allKeys = [];
      console.log(params);
      await getAllKeys(params, allKeys);
      console.log(allKeys);
      const extensions = mappingContenType[job.InputDataConfig.ContentType];
      const folder = folderMapping[job.InputDataConfig.ContentType];
      const translatedFileKeys = allKeys.filter((key) =>
        extensions.reduce((accumulator, current) => {
          return accumulator || key.endsWith(current);
        }, false)
      );
      console.log(translatedFileKeys);
      const copy = async (key) => {
        const fileName = key.replace(resultFolder, "");
        console.log(jobFolder);

        let distKey = fileName.replace(jobFolder, "").replace(folder, "");

        if (distKey.includes("-_ForwardSlash_-")) {
          const LanguageCodePrefix = job.TargetLanguageCodes + ".";
          distKey = distKey.replace(
            LanguageCodePrefix + "-_ForwardSlash_-",
            ""
          );
          distKey = distKey.split("-_ForwardSlash_-").join("/");
          const dirPath = path.dirname(distKey); //  test/folder
          const fileName = path.basename(distKey); //  demo.txt
          distKey = dirPath + "/" + LanguageCodePrefix + fileName;
        }

        await s3
          .copyObject({
            Bucket: outputBucket,
            CopySource: outputBucket + "/" + key,
            Key: distKey,
          })
          .promise();
        return distKey;
      };

      const movedKeys = await Promise.all(
        await translatedFileKeys.map(async (c) => await copy(c))
      );

      return movedKeys.map((key) => ({
        Bucket: outputBucket,
        Key: key,
        resultUrl: s3.getSignedUrl("getObject", {
          Bucket: outputBucket,
          Key: key,
          Expires: 86400, //7 days
        }),
      }));
    })
  );
  console.log(distKeys);

  return { jobName: event[0].Id, message: distKeys };
};
const getAllKeys = async (params, allKeys = []) => {
  const response = await s3.listObjectsV2(params).promise();
  response.Contents.forEach((obj) => allKeys.push(obj.Key));

  if (response.NextContinuationToken) {
    params.ContinuationToken = response.NextContinuationToken;
    await getAllKeys(params, allKeys); // RECURSIVE CALL
  }
  return allKeys;
};
