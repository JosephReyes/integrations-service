import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as IAM from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';

export class IntegrationsServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'integrations-demo-table', {
      tableName: 'integrations-demo-table',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
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
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'integrations.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 1024,
    });

    integrations.addToRolePolicy(
      new IAM.PolicyStatement({
        actions: ['dynamodb:Scan', 'dynamodb:GetItem'],
        effect: Effect.ALLOW,
        resources: [`arn:aws:dynamodb:eu-west-2:764362357816:table/${table.tableName}`],
      })
    );

    const integrationsDataSource = api.addLambdaDataSource('IntegrationsDataSource', integrations);

    integrationsDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'integrations',
    });

    integrationsDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'integration',
    });

  }
}
