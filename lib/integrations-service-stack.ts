import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as IAM from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';

export class IntegrationsServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'integrations-demo-table-joe', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const api = new appsync.GraphqlApi(this, 'IntegrationsDemoApi', {
      name: 'integrations-demo-appsync-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
    });

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
    });

    const integrations = new lambda.Function(this, 'IntegrationsHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 1024,
    });

    integrations.addToRolePolicy(
      new IAM.PolicyStatement({
        actions: ['dynamodb:Scan', 'dynamodb:GetItem'],
        effect: Effect.ALLOW,
        resources: [`arn:aws:dynamodb:eu-west-2:087958517077:table/${table.tableName}`],
      })
    );

    const credentials = new lambda.Function(this, 'CredentialsHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'credentials.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 1024,
    });

    credentials.addToRolePolicy(
      new IAM.PolicyStatement({
        actions: ['apigateway:GET'],
        effect: Effect.ALLOW,
        resources: ['arn:aws:apigateway:eu-west-2::/apikeys/*'],
      })
    );

    const integrationsDataSource = api.addLambdaDataSource('IntegrationsDataSource', integrations);
    const credentialsDataSource = api.addLambdaDataSource('CredentialsDataSource', credentials);

    integrationsDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'integrations',
    });

    credentialsDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'credentials',
    });
  }
}
