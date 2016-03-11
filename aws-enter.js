(function () {
    // Constants
    var HELP_TEXT = "Missing arguments. Run this with the --help flag for more information.";

    // Load dependencies
    var AWS = require('aws-sdk');
    var fs = require('fs');
    var _ = require('underscore');
    var path = require('path'); 
    // Set up options
    var opts = require("nomnom").option('name', {
        abbr: 'n', 
        help: 'This option selects a single AWS EC2 instance by it\'s `Name` Tag.'
    }).option('list', {
        flag: true,
        abbr: 'l',
        help: 'This option displays a list of all available EC2 instances by name.'
    }).parse();

    // Load config file
    var configFilePath = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.awsenter');
    var configFile = fs.readFileSync(configFilePath, { encoding: "ascii" });
    var config = JSON.parse(configFile || null); 
    // Main logic
    var app = {
        run: function (options) {
            if (options.request == undefined) { 
                console.log(HELP_TEXT); 
                process.exit(); 
            }
            // Load AWS root key via options object
            AWS.config.update({ 
                accessKeyId: options.config.access_key, 
                secretAccessKey: options.config.secret_access_key, 
                region: options.config.region 
            });

            // Initialize EC2
            var ec2 = new AWS.EC2();

            ec2.describeInstances({
                Filters: [ options.request.list ? null : { 
                    Name: 'tag:Name', 
                    Values: [ options.request.name ] 
                } ],
            }, function (error, query) {
                if (error) {
                    console.log(error); // an error occurred
                } else {

                    // Grab a list of all the hosts' private IP addresses, public IP addresses, and tags. 
                    // This can be easily expanded to support multiple IP output, searching by multiple tags and/or multiple tag values, etc.
                    var hosts = _.unique(
                        _.flatten(
                            _.map(query.Reservations, function (reservation) {
                                return _.map(reservation.Instances, function (instance) {
                                    return { 
                                        PublicIpAddress: instance.PublicIpAddress, 
                                        PrivateIpAddress: instance.PrivateIpAddress, 
                                        Tags: instance.Tags
                                    };
                                });
                            })
                        )
                    );

                    // For now, just output the IP address of each result on a line.
                    _.each(hosts, function (host) { 
                        // Handle simple lookup request: 
                        if (options.request.name != null) {
                            console.log(host.PublicIpAddress);
                            return;
                        }
                        // Otherwise this is a list request - show more information
                        var name = _.findWhere(host.Tags, { Key: "Name" }) || null;
                        name = name === null ? "[unnamed instance]" : name.Value;
                        console.log("Name: " + name + " | " + "Public IP: " + host.PublicIpAddress); 
                    });
                }
            });
        }
    };

    app.run({
        config: config,
        request: opts
    });

})();
