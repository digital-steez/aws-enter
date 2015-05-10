(function () {
    // Constants
    var HELP_TEXT = "Missing arguments. Run this with the --help flag for more information.";

    // Load dependencies
    var AWS = require('aws-sdk');
    var fs = require('fs');
    var _ = require('underscore');
    
    // Set up options
    var opts = require("nomnom").option('name', {
        abbr: 'n', 
        help: 'This option selects a single AWS EC2 instance by it\'s `Name` Tag.'
    }).parse();
    
    // Load config file
    var config = JSON.parse(fs.readFileSync('config.json', { encoding: "ascii" }) || null);
    
    // Main logic
    var app = {
        run: function (o) {
            if (o.request == undefined) { console.log(HELP_TEXT); process.exit(); }
            // Load AWS root key via options object
            AWS.config.update({ accessKeyId: o.config.access_key, secretAccessKey: o.config.secret_access_key, region: o.config.region });
            
            // Initialize EC2
            var ec2 = new AWS.EC2();

            ec2.describeInstances({
                Filters: [ { Name: 'tag:Name', Values: [ o.request ] } ],
            }, function (e, d) {
                if (e) {
                    console.log(e); // an error occurred
                } else {
                    
                    // Grab a list of all the hosts' private IP addresses, public IP addresses, and tags. 
                    // This can be easily expanded to support multiple IP output, searching by multiple tags and/or multiple tag values, etc.
                    var hosts = _.unique(
                        _.flatten(
                            _.map(d.Reservations, function (x) {
                                return _.map(x.Instances, function (y) {
                                    return { PublicIpAddress: y.PublicIpAddress, PrivateIpAddress: y.PrivateIpAddress, Tags: y.Tags };
                                });
                            })
                        )
                    );
                    
                    // For now, just output the IP address of each result on a line.
                    _.each(hosts, function (z) { console.log(z.PublicIpAddress); });
                }
            });
        }
    };

    app.run({
        config: config,
        request: opts.name
    });

})();