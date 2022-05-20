import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import cdk = require('aws-cdk-lib');
//import { ImagePullPrincipalType } from 'aws-cdk-lib/aws-codebuild';
//import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
//import { iam, Role } from '@aws-cdk/aws-iam';
//import { Construct } from "constructs";


class SamplePHPFargate extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Fargate Cluster
    // NOTE: Limit AZs to avoid reaching resource quotas
    //const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });
    // const privateSubnet = new ec2.PrivateSubnet(this, 'MyPrivateSubnet', {
    //   availabilityZone: 'availabilityZone',
    //   cidrBlock: 'cidrBlock',
    //   vpcId: 'vpcId',
    
    //   // the properties below are optional
    //   mapPublicIpOnLaunch: false,
    // });

    const role = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.192.0.0/16',
      maxAzs: 2,
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      gatewayEndpoints : {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
     
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          
        },

      ],
    });

    vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,

      // Uncomment the following to allow more fine-grained control over
      // who can access the endpoint via the '.connections' object.
      // open: false
    });

    vpc.addInterfaceEndpoint('secretmanagerendpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    vpc.addInterfaceEndpoint('KMS', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
    });

    vpc.addInterfaceEndpoint('APIGW', {
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
    });

    vpc.addInterfaceEndpoint('ECS', {
      service: ec2.InterfaceVpcEndpointAwsService.ECS,
    });

    // vpc.addInterfaceEndpoint('ECS_AGENT', {
    //   service: ec2.InterfaceVpcEndpointAwsService.ECS_AGENT,subnets:{onePerAz: true, subnetGroupName: 'infra'},

    // });

    vpc.addInterfaceEndpoint('SSM', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    }); 
 
    vpc.addInterfaceEndpoint('logs', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
    }); 

    vpc.addInterfaceEndpoint('ECR', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
 
    //const securityGroup = new ec2.SecurityGroup(this, 'SG', { vpc });
    //const ecsTaskExecutionRole = new iam.Role("ecsTaskExecutionRole");
    //const repo = ecr.Repository.fromRepositoryName(this, 'fargateimage', '459602490943.dkr.ecr.us-west-1.amazonaws.com/amazon-ecs-sample');
    //// Instantiate Fargate Service with just cluster and image
    //new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
    //  cluster,
    //  taskImageOptions: {
    //    image: ecs.EcrImage.fromEcrRepository(repo, 'latest'),
    //  },
    //});

    // Instantiate Fargate Service with just cluster and image

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
    
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("459602490943.dkr.ecr.us-west-1.amazonaws.com/amazon-ecs-sample:latest"),
        executionRole: role,
        taskRole: role,
      },
    });

  }
}

const app = new cdk.App();

new SamplePHPFargate(app, 'SamplePHP');

app.synth();