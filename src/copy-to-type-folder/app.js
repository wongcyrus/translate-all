const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3();

exports.lambdaHandler = async (event, context) => {
  const params = {
    Bucket: event.InputBucket /* required */,
    Prefix: event.InputS3Uri,
  };
  const allKeys = [];
  await getAllKeys(params, allKeys);
  console.log(allKeys);

  const mapping = {
    ".txt": "/!!plain!!/",
    ".xml": "/!!html!!/",
    ".html": "/!!html!!/",
    ".docx": "/!!document!!/",
    ".pptx": "/!!presentation!!/",
    ".xlsx": "/!!sheet!!/",
  };
  const mappingContenType = {
    ".txt": "text/plain",
    ".xml": "text/html",
    ".html": "text/html",
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
      const getDistKey = (key, value) => {
        const dirPath = path.dirname(key); //  test/folder
        const fileName = path.basename(key); //  demo.txt

        const hasSubFolder = dirPath.replace(event.InputS3Uri, "").length > 0;
        const translateDir = event.InputS3Uri + value;
        if (hasSubFolder) {
          const flattenSubDir = dirPath
            .replace(event.InputS3Uri, "")
            .split("/")
            .join("-_ForwardSlash_-");
          return translateDir + flattenSubDir + "-_ForwardSlash_-" + fileName;
        } else return translateDir + fileName;
      };

      const keys = allKeys
        .filter((c) => c.endsWith(key) && !c.includes(value))
        .map((c) => ({
          srcKey: c,
          distKey: getDistKey(c, value),
        }));

      console.log(keys);

      const copy = async (keyPair) =>
        await s3
          .copyObject({
            Bucket: event.InputBucket,
            CopySource: encodeURIComponent(
              event.InputBucket + "/" + keyPair.srcKey
            ),
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
