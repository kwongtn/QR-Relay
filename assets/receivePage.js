var socket = io.connect("https://qr-cottendance-265413.appspot.com/");
var sessionID = /.*(?=\.)/.exec(Math.random() * 10000).toString();
var previouslyGenerated = false;
var qrcode = new QRCode("qrcode");

document.getElementById("jsCheck").style.display = "none";
document.getElementById("sessionID").innerHTML = "Please enter your sessionID.";

socket.on("message", (message) => {
    document.getElementById("testConnection").innerHTML = message;
    console.log(message, sessionID);
});

socket.on("codeResponse", (session) => {
    console.log(session.sessionID, session.sessionKey);
    if (session.sessionID === sessionID) {
        if (session.sessionKey != "error") {
            document.getElementById("qrcode").style.display = "block";
            document.getElementById("qrerror").style.display = "none";
            console.log(session);

            // Try make QR code
            try {
                qrcode.makeCode(session.sessionKey);
                document.getElementById("receivedCode").innerHTML = session.sessionKey;
            } catch (err) {
                document.getElementById("qrcode").style.display = "none";
                document.getElementById("qrerror").style.display = "block";
                document.getElementById("qrerror").innerHTML = err;
            }
        } else {
            document.getElementById("qrcode").style.display = "none";
            document.getElementById("qrerror").style.display = "block";
        }
    } else {
        console.log("Update for: " + session.sessionID + " data \"" + session.sessionKey + "\"");
    }
});

function querySession() {
    sessionID = document.getElementById("sessionInput").value;
    console.log(sessionID);
    document.getElementById("sessionID").innerHTML = "Your sessionID is: " + sessionID;
    socket.emit("codeQuery", sessionID.toString());
};

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
