// API
module.exports = {
    get_deployment: function(response) {
        var request = require('request');
        var kudu_deployment_api = process.env.KUDU_DEPLOYMENT_API || null;
        request.get(
            {
                url: kudu_deployment_api,
                json: true
            },
            function (error, res, body) {
                if (!error && res.statusCode == 200) {
                    var commit = body[0].id;
                    var author = body[0].author;
                    var message = body[0].message;
                }
                else {
                    var commit = 'Unable to get commit';
                    var author, message = '';
                }
                response.write(commit + ' ' + author + ' ' + message);
                response.end();
            });
    }
};
