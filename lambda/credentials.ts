import * as AWS from 'aws-sdk';

const apigateway = new AWS.APIGateway({ apiVersion: '2015-07-09' });

type Event = {
  info: {
    fieldName: string;
  };
  arguments: {
    id: string;
  };
};

exports.handler = async (event: Event) => {
  console.log(event);

  const result = await apigateway.getApiKey({ apiKey: 'i0oxkopjk6', includeValue: true }).promise();
  console.log(result);

  return { apiKey: result.value }
};
