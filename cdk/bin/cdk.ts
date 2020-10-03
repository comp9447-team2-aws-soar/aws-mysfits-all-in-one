#!/usr/bin/env node

import cdk = require("@aws-cdk/core");
import 'source-map-support/register';
import { WebApplicationStack } from "../lib/web-application-stack";
import { NetworkStack } from "../lib/network-stack";
import { EcrStack } from "../lib/ecr-stack";
import { EcsStack } from "../lib/ecs-stack";
import { CiCdStack } from "../lib/cicd-stack";
import { CognitoStack } from '../lib/cognito-stack';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { APIGatewayStack } from "../lib/apigateway-stack";
import { KinesisFirehoseStack } from "../lib/kinesis-firehose-stack";
import { XRayStack } from "../lib/xray-stack";
import { SageMakerStack } from "../lib/sagemaker-stack";

const app = new cdk.App();
const networkStack = new NetworkStack(app, "MythicalMysfits-Network");
const ecrStack = new EcrStack(app, "MythicalMysfits-ECR");
const ecsStack = new EcsStack(app, "MythicalMysfits-ECS", {
    vpc: networkStack.vpc,
    ecrRepository: ecrStack.ecrRepository
});
new CiCdStack(app, "MythicalMysfits-CICD", {
    ecrRepository: ecrStack.ecrRepository,
    ecsService: ecsStack.ecsService.service
});
const dynamoDbStack = new DynamoDbStack(app, "MythicalMysfits-DynamoDB", {
    vpc: networkStack.vpc,
    fargateService: ecsStack.ecsService.service
});
const cognito = new CognitoStack(app, "MythicalMysfits-Cognito");
const apiGatewayStack = new APIGatewayStack(app, "MythicalMysfits-APIGateway", {
  userPoolId: cognito.userPool.userPoolId,
  loadBalancerArn: ecsStack.ecsService.loadBalancer.loadBalancerArn,
  loadBalancerDnsName: ecsStack.ecsService.loadBalancer.loadBalancerDnsName
});
new WebApplicationStack(app, "MythicalMysfits-Website", {
    apiGateway: apiGatewayStack.api,
    userPool: cognito.userPool,
    userPoolClient: cognito.userPoolClient
});
new KinesisFirehoseStack(app, "MythicalMysfits-KinesisFirehose", {
    table: dynamoDbStack.table,
    api: apiGatewayStack.api
});
new XRayStack(app, "MythicalMysfits-XRay");
// new SageMakerStack(app, "MythicalMysfits-SageMaker");
