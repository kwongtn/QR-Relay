var socket = io.connect("https://qr-cottendance-265413.appspot.com/");
var sessionID = 0;
var keyExists = false;

document.getElementById("jsCheck").style.display = "none";
resizeFunction();

// Get session ID from server.
socket.emit("getSessionID", true);
socket.on("acceptSessionID", (receivedID) => {
    sessionID = receivedID;
    document.getElementById("sessionID").innerHTML = "Your given sessionID is: <b>" + sessionID + "</b>";
});

socket.on("message", (message) => {
    document.getElementById("testConnection").innerHTML = message;
    console.log(message, sessionID);
});

socket.on("keyResponse", (response) => {
    document.getElementById("sentCode").innerHTML = response;
});

socket.on("codeVerification", (exists) => {
    if (exists) {
        document.getElementById("keyExist").style.display = "block";
        document.getElementById("sendingKey").style.display = "none";
        keyExist = true;
    } else if (!exists) {
        document.getElementById("sendingKey").style.display = "block";
        document.getElementById("keyExist").style.display = "none";
        sessionID = document.getElementById("sessionInput").value;
        keyExist = false;
    }
});

// Sends provided key to server.
function sendKey() {
    socket.emit("codeSubmit", { ID: sessionID, key: document.getElementById("sendingKey").value.toString() });
    document.getElementById("sentCode").innerHTML = document.getElementById("sendingKey").value;
}

function querySession() {
    sessionID = document.getElementById("sessionInput").value;
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
