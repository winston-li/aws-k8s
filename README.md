# Deploy DRAMA on Amazon Web Services (with Kubernetes, CoreOS, and Flannel)

### Prerequisites: 
    1. AWS account 
    2. AWS CLI
    3. Node.js & npm 
    
### 1. Installation:	
    npm install (under project's root folder) 

### 2. Setup cluster configuration:
    cluster configuration is specified in conf/cluster.yaml
    (1) cluster_name must be unique for each cluster
    (2) master_ip must be within vnet address space

### 3. Setup AWS CLI configuration:		
    (1) create an IAM role, and then get "Access Key ID" & "Secret Access Key" via AWS Management Console
    (2) configure aws cli with "Access Key ID" & "Secret Access Key"
        Winstonteki-MacBook-Air:~ Winston$ aws configure
        AWS Access Key ID [****************QLIA]: 
        AWS Secret Access Key [****************/kHm]: 
        Default region name [us-west-1]: 
        Default output format [table]: 
        
### 4. Create the cluster:
    (1) create SSH Key Pair via AWS Management Console (keyname: <cluster_name>_ssh, e.g. kube_ssh)
    (2) 
    
###  5. Check cluster status

### 6. Enable browsers to access Spark UI on Azure, add an entry to your DNS server

### 7. Scale the cluster when needed:
                
### 8. Shutdown the cluster:
        
### 9. Startup the cluster:

### 10. Destroy the cluster:


## NOTES:
1. Infrasturucre Resources Template Illustrated:
    (1) Virtual Network
                              InternetGateway  <--------------------------------------|
                                    |                                                 |
                            VPCGatewayAttachment                                      |
                                    |                                                 |
        VPC (192.168.0.0/16)------------------------------------------------------|   |
         |                                                                        |   |
         |   |------------------------|      |------------------|                 |   |
         |   |Subnet (192.168.0.0/24) |      |                  |                 |   |
         |   |.[AvailabilityZone]     |      |   |--------------|-------------- | |   |
         |   |-----------|------------|      |   |RouteTable                    | |   |
         |               |                   |   |------------------------------| |   |
         |       SubnetRouteTableAssociation |   | Route:                       | |   |
         |               |-------------------|   | (DestinationCidr: 0.0.0.0/0, | |   |  
         |                                       |  GatewayId: InternetGateway) |-----|   
         |                                       |------------------------------- |
         |                                                                        |
         |------------------------------------------------------------------------|
                               
    (2) Security Group
        -- MasterSecurityGroup:
           Protocol       FromPort    ToPort     CidrIp/DestinationSecurityGroupId     Note
              TCP            0        65535               0.0.0.0/0
              UDP            0        65535               0.0.0.0/0
           Protocol       FromPort    ToPort     CidrIp/SourceSecurityGroupId          Note
             ICMP           -1          -1                0.0.0.0/0
              TCP           22          22                0.0.0.0/0                     SSH
              TCP          443         443                0.0.0.0/0                    HTTPS             
              TCP         2379        2379            WorkerSecurityGroup               etcd
              UDP         8472        8472            WorkerSecurityGroup             flannel
           
        -- WorkerSecurityGroup:
           Protocol       FromPort    ToPort     CidrIp/DestinationSecurityGroupId     Note
              TCP            0        65535               0.0.0.0/0
              UDP            0        65535               0.0.0.0/0
           Protocol       FromPort    ToPort     CidrIp/SourceSecurityGroupId          Note
             ICMP           -1          -1                0.0.0.0/0
              TCP           22          22                0.0.0.0/0                     SSH
              UDP         8472        8472            MasterSecurityGroup             flannel           
              UDP         8472        8472            WorkerSecurityGroup             flannel           
              TCP        10250       10250            MasterSecurityGroup             kubelet
              TCP        10255       10255            WorkerSecurityGroup        kubelet readonly (To Be Removed)
              TCP         4194        4194            MasterSecurityGroup             cAdvisor
              
        Note: To avoid circular dependency between SecurityGroups, use "SecurityGroupIngress" for some rules.
        
    (3) IAM
        IAM MasterRole & InstanceProfile
        -- Policies: 
            { "Action": "ec2:*", "Effect": "Allow", "Resource": "*" }
            { "Action": "kms:Decrypt", "Effect": "Allow", "Resource": "[KMSKeyARN]" }            
        IAM WorkerRole & InstanceProfile
        -- Policies: 
            { "Action": "ec2:Describe*", "Effect": "Allow", "Resource": "*" }
            { "Action": "ec2:AttachVolume", "Effect": "Allow", "Resource": "*" }            
            { "Action": "ec2:DetachVolume", "Effect": "Allow", "Resource": "*" }            
            { "Action": "kms:Decrypt", "Effect": "Allow", "Resource": "[KMSKeyARN]" } 
                    
    (4) VM LifeCycle
        -- Master:
            <1> EIP
                { "Domain": "vpc", "InstanceId": "[Master EC2 Instance]" }
            <2> CloudWatch::Alarm
                AlarmActions: "arn:aws:automate:[Region]:ec2:recover"
                Dimensions: associate "InstanceId" to Master EC2 Instance 
            <3> Master EC2 Instance:
                .IAM MasterRole's instance profile
                .SSH Keyname
                .BlockDeviceMappings
                .UserData
                .NetworkInterfaces:
                    MasterSecurityGroup
                    PrivateIpAddress
                    SubnetId
                        
        -- Worker:
            <1> AutoScalingGroup:
                .AvailabilityZones
                .Worker LaunchConfiguration
                .VPC SubnetId
                .CreationPolicy
                .UpdatePolicy
                .MaxSize
                .MinSize
                .DesiredCapacity 
            <2> Worker LaunchConfiguration
                .IAM WorkerRole's instance profile
                .SSH Keyname
                .BlockDeviceMappings
                .UserData
                .WorkerSecurityGroup    

2. CloudFormation has Parameter value < 4096 bytes limitation, since our UserData is larger than 4K, we need to place it in Resources directly.
3. ToDo:
   (1) WorkerAutoScale's CreationPolicy
   (2) Scaling SOP
   (3) Master & Worker Hostname
   (4) FQDN of Master
   (5) Condition & Wait while creating resources