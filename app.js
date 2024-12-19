const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

//Linking  socket with the express server
const server=http.createServer(app);
const io=socket(server);

const chess = new Chess();        
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",async (req,res)=>{
    res.render("index",{title:"Chess game"});
});

io.on("connection",(uniquesocket)=>{
    console.log("Connected");
 
    if(!players.white)
    {
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black)
    {
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else
    {
        uniquesocket.emit("spectatorRole")
    }

    uniquesocket.on("disconnect",()=>{
        if(uniquesocket.id === players.white)
        {
            delete players.white;
        }
        if(uniquesocket.id === players.black)
        {
            delete players.black;
        }
    });

    uniquesocket.on("move",(move)=>{
        try{
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;


            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }
            else{
                console.log("Invalid move: "+move);
                uniquesocket.emit("invalidMove",move);
            }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("invalidMove: ",move)
        }
    });
 
})
 

server.listen(3000,()=>{
    console.log("server running on port 3000");
})