exports.lambdaHandler = async (event, context) => {
  console.log(JSON.stringify(event));
  let index = event.iterator.index;
  let step = event.iterator.step;
  //TODO: remove temp fix for know bug in SAM https://github.com/awslabs/serverless-application-model/issues/1616
  let count = +event.iterator.count;
  index += step;

  console.log(event);
  if (
    typeof event.iterator.continue !== "undefined" &&
    !event.iterator.continue
  )
    return event.iterator;
  else
    return {
      index,
      step,
      count: "" + count,
      continue: index < count,
    };
};
