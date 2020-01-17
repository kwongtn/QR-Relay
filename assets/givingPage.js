var socket = io.connect("https://localhost:8080");
var sessionID = 0;
var keyExists = false;


document.getElementById("jsCheck").style.display = "none";

// Get session ID from server.
socket.emit("getSessionID", true);
socket.on("acceptSessionID", (receivedID) => {
    sessionID = receivedID;
    document.getElementById("sessionID").innerHTML = "Your given sessionID is: " + sessionID;
});

socket.on("message", (message) => {
    document.getElementById("testConnection").innerHTML = message;
    console.log(message, sessionID);
});

socket.on("codeResponse", (session) => {
    if (session.sessionID == sessionID) {
        document.getElementById("qrcode").style.display = "block";
        document.getElementById("qrerror").style.display = "none";
        console.log(session.sessionKey);
        qrcode.makeCode(session.sessionKey)
    } else {
        document.getElementById("qrcode").style.display = "none";
        document.getElementById("qrerror").style.display = "block";
    }
});

socket.on("codeVerification", (exists) => {
    if (exists) {
        document.getElementById("keyExist").style.display = "block";
        document.getElementById("sendingKey").style.display = "none";
        keyExist = true;
    } else if (!exists) {
        document.getElementById("sendingKey").style.display = "block";
        document.getElementById("keyExist").style.display = "none";
        keyExist = false;
    }
});

// Sends provided key to server.
function sendKey() {
    if(!keyExists) {
        console.log("Key does not exist.");
        socket.emit("codeSubmit", { ID: sessionID, key: document.getElementById("sendingKey").value.toString() });
        console.log(document.getElementById("sendingKey").value.toString());
    } else {
        console.log("Key exists.");
        document.getElementById("keyExist").innerHTML = "ID exists. Please choose another ID before proceeding.";
    }
}

function querySession() {
    sessionID = document.getElementById("sessionInput").value;
    console.log(sessionID);
    document.getElementById("sessionID").innerHTML = "Your chosen sessionID is: " + sessionID;
    socket.emit("codeCheck", sessionID.toString());
};

function checkIfExists(sessionID) {
    socket.emit("codeCheck", sessionID.toString());
}

// Poke functions
socket.on("pokeResponse", (response) => {
    if (sessionID == response) {
        document.getElementById("test").innerHTML = "Yup you're still connected.";
    } else {
        document.getElementById("test").innerHTML = "Hmm something is wrong...";
    }
});

function pokeFunction() {
    socket.emit("pokeQuery", sessionID);
    document.getElementById("test").innerHTML = "Lemme test... (If this is shown for too long then you have a connection problem)";
};
