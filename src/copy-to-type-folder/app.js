const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3();

exports.lambdaHandler = async (event, context) => {
  //event.InputBucket + "/" + event.InputS3Uri

  const params = {
    Bucket: event.InputBucket /* required */,
    Prefix: event.InputS3Uri,
  };
  const allKeys = [];
  await getAllKeys(params, allKeys);

  const mapping = {
    ".txt": "/plain/",
    ".xml": "/web/",
    ".html ": "/web/",
    ".docx": "/document/",
    ".pptx": "/presentation/",
    ".xlsx": "/sheet/",
  };
  const mappingContenType = {
    ".txt": "text/plain",
    ".xml": "text/html",
    ".html ": "text/html",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const keys = await Promise.all(
    Object.entries(mapping).map(async ([key, value]) => {
      console.log(`${key} ${value}`);

      const oldKeys = allKeys.filter((c) => c.includes(value));

      console.log(oldKeys);
      if (oldKeys.length > 0) {
        const params = { Bucket: event.InputBucket };
        params.Delete = { Objects: [] };
        oldKeys.forEach((key) => {
          params.Delete.Objects.push({ Key: key });
        });
        console.log(params);
        await s3.deleteObjects(params).promise();
      }

      const keys = allKeys
        .filter((c) => c.endsWith(key) && !c.includes(value))
        .map((c) => ({
          srcKey: c,
          distKey: path.dirname(c) + value + path.basename(c),
        }));

      console.log(keys);

      const copy = async (keyPair) =>
        await s3
          .copyObject({
            Bucket: event.InputBucket,
            CopySource: event.InputBucket + "/" + keyPair.srcKey,
            Key: keyPair.distKey,
          })
          .promise();
      console.log(await Promise.all(keys.map(async (c) => await copy(c))));
      return { key, found: keys.length > 0 };
    })
  );
  event.contentTypes = keys
    .filter((c) => c.found)
    .map((c) => mappingContenType[c.key]);

  return event;
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
