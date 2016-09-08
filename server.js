var Moniker = require('moniker');
var wget = require('wget-improved');
var util = require('util');
var formidable = require('formidable');
var fs = require('fs');
var http = require('http');
var gm = require('gm');
var magick = gm.subClass({imageMagick: true});

function get_random_name() {
    var name = Moniker.generator([Moniker.adjective, Moniker.noun]);
    return name.choose();
}

function respond_with_expectation_failed(response) {
    console.log('Responding with HTTP 417 Expectation Failed');
    response.writeHead(417, {
        'Content-Type': 'text/plain'
    });
    response.write('I always wanted to return a HTTP 417 Expectation Failed.\n' +
                   'By the way, we could not fetch the gif from the URL you specified.');
    response.end();
}


function fetch_gif(gifurl, infile, response, callback_magick) {
    var options = {};
    try {
        var download = wget.download(gifurl, infile, options);
        download.on('error', function(err) {
            console.log('wget download.on(error) -- ' + err);
            respond_with_expectation_failed(response);
        });
        download.on('start', function(filesize) {
            console.log('Fetching gif to: ' + infile);
            console.log('Download started: ' + filesize);
        });
        download.on('end', function(output) {
            console.log(output);
            callback_magick();
        });
        download.on('progress', function(progress) {
            if (progress == 1) {
                console.log('wget finished: ' + progress);
            }
        });
    }
    catch (e) {
        console.error('wget failed -- catch(e): ' + e);
        respond_with_expectation_failed(response);
    }
}


function do_magick(request, response) {
    var name = get_random_name();
    var infile = '/tmp/' + name;
    console.log('infile set to: ' + infile);
    var outfile = 'p/' + name + '.gif';
    console.log('outfile set to: ' + outfile);
    // Make sure output directory exists
    var outdir = 'p';
    if (!fs.existsSync(outdir)) {
        try {
            fs.mkdirSync(outdir);
        }
        catch (e) {
            console.error('Unable to create output directory: ' + e);
        }
        
    }
    var form = new formidable.IncomingForm();
    form.parse(request, function (err, fields, files) {
        var gifurl = fields.gifurl || 'http://null'; // wget panics if passed undefined as URL
        var pictext = fields.text;
        console.log('Got text from form: ' + pictext);
        fetch_gif(gifurl, infile, response, function () {
            console.log('Calling imagemagick for ' + pictext);
	    magick(infile)
	      .stroke("#000000")
	      .fill('#ffffff')
	      .font("./impact.ttf", 42)
              .dither(false)
              .drawText(0, 0, pictext, 'South')
	      .write(outfile, function (err) {
	          if (!err) {
	              console.log('Image processing done.');
                      console.log('outfile: ' + outfile);
		      redirect_to_outfile(response, name);
		  }
		  else console.log(err);
              });
	});
    });
}


function displayForm(response) {
    fs.readFile('form.htm', function (err, data) {
        response.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });
        response.write(data);
        response.end();
    });
}


function redirect_to_outfile(response, name) {
        response.writeHead(302, {
            'Location': '/p/' + name + '.gif'
        });
        response.end();
}


function onRequest(request, response) {
    if (request.method == 'GET' && request.url.match(/^\/p\/.+/)) {
        console.log('request.url = ' + request.url);
        try {
            var img = fs.readFileSync(request.url.replace('/p/', 'p/'));
            response.writeHead(200, {
                'Content-Type': 'image/gif'
            });
            response.end(img, 'binary');
        }
        catch (e) {
            displayForm(response);
        }
            
    }
    else if (request.method == 'GET') {
        displayForm(response);
    }
    else if (request.method == 'HEAD') {
        response.writeHead(200);
        response.end();
    }
    else if (request.method == 'POST') {
        console.log('got POST');
        do_magick(request, response);
    }
}
 
http.createServer(onRequest).listen(process.env.PORT || 3000);
console.log('Listening for requests on port ' + (process.env.PORT || 3000));
