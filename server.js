var http = require('http');
// var https = require('https');
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

// const serverOptions = {
//     key: fs.readFileSync("./cert/key.pem"), 
//     cert: fs.readFileSync("./cert/cert.pem")
// };

// Load html file
var server = http.createServer(/*serverOptions, */(req, res) => {
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

// Load socket.io
var io = require('socket.io').listen(server);

// Alert console when connected
io.sockets.on('connection', (socket) => {
    socket.emit("message", "You are connected. Welcome.");
    console.log("[" + new Date() + "] " + ++clientCount + " connection attempts since server start.");

    // To check if code is taken.
    socket.on("codeCheck", (check) => {
        socket.emit("codeVerification", sessionKeys.hasOwnProperty(check));
    });

    // Server generates a sessionID and responses
    socket.on("getSessionID", () => {
        socket.sessionID = 0;
        socket.exists = true;

        do {
            socket.sessionID = /.*(?=\.)/.exec(Math.random() * 10000).toString();
            if (sessionKeys.hasOwnProperty(socket.sessionID)) {
                socket.exists = true;
            } else {
                sessionKeys[socket.sessionID] = "";
                socket.exists = false;
            }

        } while (socket.exists)
        console.log("[" + new Date() + "] " + "Given sessionID: " + socket.sessionID);
        socket.emit("acceptSessionID", socket.sessionID);
    });

    // To receive and respond session keys.
    socket.on("codeSubmit", (submission) => {
        sessionKeys[submission.ID.toString()] = submission.key.toString();
        socket.broadcast.emit("codeResponse", {sessionID: submission.ID.toString(), sessionKey: submission.key.toString() });
        socket.emit("keyResponse", submission.key);
        console.log(submission);
        console.log(sessionKeys);
    });

    // To check and respond session keys to requester.
    socket.on("codeQuery", (request) => {
        console.log(sessionKeys);
        try {
            socket.emit("codeResponse", { sessionID: request.toString(), sessionKey: sessionKeys[request].toString() });
        } catch (err) {
            socket.emit("codeResponse", { sessionID: request, sessionKey: "error"});
            console.log("Probably value does not exist.");
        }
        console.log("[" + new Date() + "] " + request + " : " + sessionKeys[request]);
    });

    // Poke functions
    socket.on("pokeQuery", (response) => {
        socket.emit("pokeResponse", response);
        console.log("Poke " + ++pokeCount + " from " + response);
    });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT);