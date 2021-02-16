#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { IntegrationsServiceStack } from '../lib/integrations-service-stack';

const app = new cdk.App();
new IntegrationsServiceStack(app, 'IntegrationsServiceStack');
