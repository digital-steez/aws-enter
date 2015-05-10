aws-enter
===================


aws-enter is a script that outputs the public IP address associated with Amazon EC2 instances, looked up via the "Name" EC2 tag. 

The main use-case for this is connecting via SSH. For example, if you are user *billyb* and have a machine that was given the EC2 Name tag *boris*, you would connect to it like so: 

    $ ssh -v -A billyb@$(node aws-enter.js --name boris)
This means that you can also use this for SCP, or any other UNIX network utility that expects an IP address. 