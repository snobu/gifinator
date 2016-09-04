var wget = require('node-wget');
var util = require('util');
var formidable = require('formidable');
var fs = require('fs');
var http = require('http');
var gm = require('gm');
var magick = gm.subClass({imageMagick: true});


function do_magick(request, response) {
    var form = new formidable.IncomingForm();
    form.parse(request, function (err, fields, files) {
        var gifurl = fields.gifurl;
        var pictext = fields.text;
        wget({
                url: gifurl,
                dest: '/tmp/in.gif'
             },
             //callback
             function(error, responseFromWget, body) {
                console.log(responseFromWget.headers);
                // annotate gif
		magick('/tmp/in.gif')
		  .stroke("#000000")
		  .fill('#ffffff')
		  .font("./impact.ttf", 42)
		  .drawText(0, 0, pictext, 'South')
		  .write("./out.gif", function (err) {
		      if (!err) {
			  console.log('Image processing done.');
			  show_gif(response);
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


function show_gif(response) {
        var img = fs.readFileSync('out.gif');
        response.writeHead(200, {'Content-Type': 'image/gif'});
        response.end(img, 'binary');
}


function onRequest(request, response) {
    if (request.method == 'GET') {
        displayForm(response);
    } else if (request.method == 'POST') {
        console.log('got POST');
        do_magick(request, response);
    }
}
 
http.createServer(onRequest).listen(process.env.PORT || 3000);
console.log('Listening for requests.');
