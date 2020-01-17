var https = require('https');
var url = require('url');
var fs = require('fs');

/** JSON that stores the session keys
 ** `sessionID` as Key
 ** - `val` as passedValue
 ** - `timeStamp` as last update time  
 ** Sample:
 * sessionID: {val: "", timeStamp: ""}
**/
var sessionKeys = {};

var clientCount = 0;
var pokeCount = 0;

const serverOptions = {
    key: fs.readFileSync("./cert/key.pem"), 
    cert: fs.readFileSync("./cert/cert.pem")
};

// Load html file
var server = https.createServer(serverOptions, (req, res) => {
    var q = url.parse(req.url);

    // If there is no path specified load index.html
    if (q.pathname.toString() == "/") {
        fs.readFile("./index.html", 'utf-8', (err, content) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else if (q.pathname.toString() == "/receive" || q.pathname.toString() == "/giving") {
        // Else load the requested file.
        fs.readFile("./" + q.pathname + ".html", "utf-8", (err, content) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
            // console.log("Sent " + q.path);
        });
    } else {
        // Else load the requested file.
        fs.readFile("./" + q.pathname, "utf-8", (err, content) => {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(content);
            // console.log("Sent " + q.path);
        });
    }


});


server.listen(8080);