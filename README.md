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
    (2) master_hostip must be within vnet address space

### 3. Setup AWS CLI configuration:
    (1) create an IAM role, and then get "Access Key ID" & "Secret Access Key" via AWS Management Console
    (2) configure aws cli with "Access Key ID" & "Secret Access Key"
        Winstonteki-MacBook-Air:~ Winston$ aws configure
        AWS Access Key ID [****************QLIA]:
        AWS Secret Access Key [****************/kHm]:
        Default region name [us-west-1]:
        Default output format [table]:

### 4. Create the cluster template file:
    (1) create and download SSH Key Pair via AWS Management Console (keyname: <cluster_name>_ssh, e.g. kube_ssh)
    (2) Winstonteki-MacBook-Air:aws-k8s Winston$ ./create-kubernetes-cluster-template.js
    
### 5. Validate the template file:
        Winstonteki-MacBook-Air:aws-k8s Winston$ aws cloudformation validate-template --template-body file:///Users/Winston/GitHub/aws-k8s/output/awskube_deployment.json

### 6. Create the cluster via template file:
        Use CloudFormation Management Console for now.
        [TODO: AWS CLI below]
        Winstonteki-MacBook-Air:aws-k8s Winston$ aws cloudformation create-stack --stack-name myteststack --template-body file:///Users/Winston/GitHub/aws-k8s/output/awskube_deployment.json

### 7. Check cluster status
        Winstonteki-MacBook-Air:aws-k8s Winston$ vi ~/.kube/config
        [NOW, TEMPORARILY]
            - cluster:
                certificate-authority: /Users/Winston/GitHub/aws-k8s/credentials/awskube/ca/ca.pem
                server: https://ec2-52-41-61-177.us-west-2.compute.amazonaws.com:3443
              name: awskube-cluster
        [EXPECTED, AFTER MASTER FQDN RESOLVED]
            - cluster:
                certificate-authority: /Users/Winston/GitHub/aws-k8s/credentials/awskube/ca/ca.pem
                server: https://awskube-master00.us-west-2.compute.amazonaws.com:3443
              name: awskube-cluster

        Winstonteki-MacBook-Air:aws-k8s Winston$ kubectl get nodes
            NAME                                          LABELS                                                               STATUS    AGE
            ip-192-168-0-111.us-west-2.compute.internal   kubernetes.io/hostname=ip-192-168-0-111.us-west-2.compute.internal   Ready     2m
            ip-192-168-0-112.us-west-2.compute.internal   kubernetes.io/hostname=ip-192-168-0-112.us-west-2.compute.internal   Ready     2m

        Winstonteki-MacBook-Air:aws-k8s Winston$ kubectl get namespaces
            NAME          LABELS    STATUS    AGE
            default       <none>    Active    2m
            develop       <none>    Active    2m
            kube-system   <none>    Active    2m
            production    <none>    Active    2m
            staging       <none>    Active    2m

        Winstonteki-MacBook-Air:aws-k8s Winston$ kubectl get services --all-namespaces
            NAMESPACE     NAME         CLUSTER_IP   EXTERNAL_IP   PORT(S)         SELECTOR           AGE
            default       kubernetes   10.3.0.1     <none>        443/TCP         <none>             3m
            kube-system   heapster     10.3.0.127   <none>        80/TCP          k8s-app=heapster   3m
            kube-system   kube-dns     10.3.0.10    <none>        53/UDP,53/TCP   k8s-app=kube-dns   3m

        Winstonteki-MacBook-Air:aws-k8s Winston$ kubectl get pods --all-namespaces
            NAMESPACE     NAME                                                     READY     STATUS    RESTARTS   AGE
            kube-system   heapster-v1.0.2-swbyl                                    1/1       Running   0          3m
            kube-system   kube-apiserver-awskube-master00                          1/1       Running   0          22s
            kube-system   kube-controller-manager-awskube-master00                 1/1       Running   0          24s
            kube-system   kube-dns-v11-3e7de                                       4/4       Running   0          3m
            kube-system   kube-proxy-awskube-master00                              1/1       Running   0          22s
            kube-system   kube-proxy-ip-192-168-0-111.us-west-2.compute.internal   1/1       Running   0          3m
            kube-system   kube-proxy-ip-192-168-0-112.us-west-2.compute.internal   1/1       Running   0          2m
            kube-system   kube-scheduler-awskube-master00                          1/1       Running   0          23s
            kube-system   kube-vulcand-rc-e072i                                    0/3       Pending   0          3m

### 8. SSH to each VM to check status if needed
        (1) Winstonteki-MacBook-Air:aws-k8s Winston$ ssh-add ~/.ssh/awskube_ssh.pem
        // ssh to master VM
        (2)
        [NOW, TEMPORARILY]
            Winstonteki-MacBook-Air:aws-k8s Winston$ ssh -A -i ~/awskube_ssh.pem core@ec2-52-41-61-177.us-west-2.compute.amazonaws.com
        [EXPECT, TODO]
            Winstonteki-MacBook-Air:aws-k8s Winston$ ssh -A -i ~/awskube_ssh.pem core@awskube-master00.us-west-2.compute.amazonaws.com
        // ssh to worker VMs through master
        (3) core@kube-master00 ~ $ ssh -A core@ip-192-168-0-111.us-west-2.compute.internal

### 9. Scale up/down the cluster

### 10. Shutdown the cluster:

### 11. Startup the cluster:

### 12. Destroy the cluster:
        aws cloudformation  delete-stack --stack-name <value>


## NOTES:
1. Infrasturucre Resources Template Illustrated:
    1. Virtual Network
    ```
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
    ```

    2. Security Group
    ```
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
    ```

    3. IAM
    ```
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
    ```

    4. VM LifeCycle
    ```
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
    ```

2. CloudFormation has a limitation of "Parameter value < 4096 bytes", since our UserData is larger than 4K, we need to place it in Resources directly. In addition, EC2's UserData must be less than 16KB, so, gzip our UserData first, then base64 encode it.

3. ToDo:

    (1) Figure out how to setup Master's Hostname & FQDN for coreos in AWS EC2 & Route53

    (2) WorkerAutoScale's CreationPolicy

    (3) Scaling SOP

    (4) Condition & Wait while creating resources