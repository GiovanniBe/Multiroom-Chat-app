const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const cache = {};


function send404(response) {
  response.writeHead(404, {'Content-Type' : 'text/plain'});
  response.write('Error 404 : resource not found.');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {'content-type' : mime.lookup(path.basename(filePath))});
  response.end(fileContents);
}

/**
 * Determines if a file is cached, if so, serves it. If the file isn't cached, it's read
 * from the disk and served. If the file doesn't exist, an HTTP 404 error is returned
 * @param  {[type]} response     [description]
 * @param  {[type]} cache        [description]
 * @param  {[type]} abstractPath [description]
 * @return {[type]}              [description]
 */

function serverStatic(response, cache, abstractPath) {
  if (cache[abstractPath]) {
    sendFile(response, abstractPath, cache[abstractPath]);
  } else {
    fs.exists(abstractPath, function(exists) {
      if (exists) {
        fs.readFile(abstractPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[abstractPath] = data;
            sendFile(response, abstractPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}

/**
 * Creating an HTTP server, the callback defines how each HTTP request should be handled.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */

const server = http.createServer(function(req, res) {

  let filePath = false;

  if (req.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }

  let abstractPath = './' + filePath;

  serverStatic(res, cache, abstractPath);

});

server.listen(3000, function() {
  console.log('Server listening on port 3000..');
});
