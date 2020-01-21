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

/** How long each key should retain until considered inactive to be removed at next connection.
 * Common times:
 * * 5 mins = 3.0e5
 * * 30 mins = 1.8e6
 * * 1 hour = 3.6e6
 * * 12 hours = 4.32e7
 * * 1 day = 8.64e7
 * * 1 week = 6.048e8
 */
const timeOut = 1.8e6;

/** Multiplier to be used to generate IDs. If too many are used it will be multiplied by 10.
*/
var idMultiplier = 10000;

/**
 * Time in miliseconds on the time of last purge operation.
 */
var lastPurge = 0;

// const serverOptions = {
//     key: fs.readFileSync("./cert/key.pem"), 
//     cert: fs.readFileSync("./cert/cert.pem")
// };

logger("Server start.");

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
    } else if (q.pathname.toString() == "/log981126565543"){
        fs.readFile("./misc/qr-relay.log", "utf-8", (err, content) => {
            res.writeHead(200, { 'Content-Type': 'text/plain'});
            res.end(content);
        });
    } else if (q.pathname.toString() == "/ads.txt"){
        fs.readFile("./misc/ads.txt", "utf-8", (err, content) => {
            res.writeHead(200, { 'Content-Type': 'text/plain'});
            res.end(content);
        });
    }else {
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

    // Only purge when the list has not been purge for the last (timeout/3) minutes
    if ((new Date().getTime() - lastPurge) > (timeOut / 3)){
        purge();
    }

    logger(++clientCount + " connection attempts since server start.");

    // To check if code is taken.
    socket.on("codeCheck", (check) => {
        if (!sessionKeys.hasOwnProperty(check)) {
            sessionKeys[check] = { timeStamp: new Date().getTime() };
            socket.emit("codeVerification", false);
            // logger(sessionKeys);
        } else {
            socket.emit("codeVerification", true);
        }
    });

    // Server generates a sessionID and responses
    socket.on("getSessionID", () => {
        socket.sessionID = 0;
        socket.exists = true;
        var attempts = 0;

        do {
            socket.sessionID = /.*(?=\.)/.exec(Math.random() * idMultiplier).toString();
            if (sessionKeys.hasOwnProperty(socket.sessionID)) {
                socket.exists = true;
                logger("Code " + socket.sessionID + " taken. Generating another one.");
                attempts++;

                if(attempts > (idMultiplier / 10)){
                    idMultiplier *= 10;
                }

            } else {
                sessionKeys[socket.sessionID] = { timeStamp: new Date().getTime() };
                socket.exists = false;
            }

        } while (socket.exists)
        logger("Given sessionID: " + socket.sessionID);
        socket.emit("acceptSessionID", socket.sessionID);
    });

    // To receive and respond session keys.
    socket.on("codeSubmit", (submission) => {
        logger("Received " + JSON.stringify(submission));
        if (!sessionKeys.hasOwnProperty(submission.ID)) {
            sessionKeys[submission.ID] = { timeStamp: new Date().getTime() };
        }

        // Writes the value and timestamp of the received key
        sessionKeys[submission.ID].val = submission.key;
        sessionKeys[submission.ID].timeStamp = new Date().getTime();

        socket.broadcast.emit("codeResponse", { sessionID: submission.ID.toString(), sessionKey: submission.key.toString() });
        socket.emit("keyResponse", submission.key);
    });

    // To check and respond session keys to requester.
    socket.on("codeQuery", (request) => {
        // console.log(sessionKeys);
        try {
            console.log(sessionKeys[request].val);
            if (JSON.stringify(sessionKeys[request].val).toString() === "{}") {
                socket.emit("codeResponse", { sessionID: request, sessionKey: "error" });
                logger("Value does not exist for " + request);
            } else {
                socket.emit("codeResponse", { sessionID: request.toString(), sessionKey: sessionKeys[request].val });
                logger(request + " : " + JSON.stringify(sessionKeys[request]));
            }
        } catch (err) {
            socket.emit("codeResponse", { sessionID: request, sessionKey: "error" });
            logger(request + " : " + err.message);
        }
    });

    // Poke functions
    socket.on("pokeQuery", (response) => {
        socket.emit("pokeResponse", response);
        logger("Poke " + ++pokeCount + " from " + response);
    });
});

function purge() {
    var currTime = new Date().getTime();
    var purgeCount = 0;
    for (var IDs in sessionKeys) {
        if (currTime - sessionKeys[IDs].timeStamp >= timeOut) {
            delete sessionKeys[IDs];
            purgeCount++;
        }
    }
    if (purgeCount > 0){
        logger("Purged " + purgeCount + " values in " + (currTime - new Date().getTime()) + " ms");
        lastPurge = new Date().getTime();
    }
}

function logger(message){
    message = "[" + new Date().toISOString() + "] " + message;
    console.log(message);
    fs.appendFile("./misc/qr-relay.log", message + "\n", (err) => { 
        
    });
}

const PORT = process.env.PORT || 8080;

server.listen(PORT);