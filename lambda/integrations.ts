import * as AWS from 'aws-sdk';

const dynamoClient = new AWS.DynamoDB.DocumentClient();

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

  if (event.arguments.id) {
    const result = await dynamoClient
      .get({
        TableName: 'integrations-demo-table',
        Key: { id: event.arguments.id },
      })
      .promise();
    return result.Item;
  } else {
    const result = await dynamoClient.scan({ TableName: 'integrations-demo-table' }).promise();
    return result.Items?.sort((a, b) => a.id.slice(-1) - b.id.slice(-1));
  }
};
