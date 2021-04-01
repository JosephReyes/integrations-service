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
        TableName: 'IntegrationsServiceStack-joe-integrationsdemotablejoe56FD4A97-12I4LGQ8JWUUJ',
        Key: { id: event.arguments.id },
      })
      .promise();
    return [result.Item];
  } else {
    const result = await dynamoClient
      .scan({ TableName: 'IntegrationsServiceStack-joe-integrationsdemotablejoe56FD4A97-12I4LGQ8JWUUJ' })
      .promise();
    return result.Items;
  }
};

