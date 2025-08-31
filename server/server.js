import express, { json } from "express";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(json());

const games = new Map();
const playerToGame = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.get("/", (req, res) => {
  res.json({
    status: "Chess server is running",
    activeGames: games.size,
    connectedPlayers: playerToGame.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    activeGames: games.size,
    connectedPlayers: playerToGame.size,
  });
});

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("createGame", () => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (games.has(roomCode));

    const game = {
      roomCode,
      white: socket.id,
      black: null,
      moves: [],
      createdAt: Date.now(),
    };

    games.set(roomCode, game);
    playerToGame.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit("gameCreated", { roomCode });
    console.log(`Game created: ${roomCode} by ${socket.id}`);
  });

  socket.on("joinGame", (roomCode) => {
    roomCode = roomCode.toUpperCase();
    const game = games.get(roomCode);

    if (!game) {
      socket.emit("error", "Game not found");
      return;
    }

    if (game.black) {
      socket.emit("error", "Game is already full");
      return;
    }

    game.black = socket.id;
    playerToGame.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit("gameJoined", { roomCode });

    io.to(roomCode).emit("gameStart");
    console.log(`Game started: ${roomCode}`);
  });

  socket.on("move", (data) => {
    const { roomCode, move } = data;
    const game = games.get(roomCode);

    if (!game) {
      socket.emit("error", "Game not found");
      return;
    }

    const isWhite = game.white === socket.id;
    const isBlack = game.black === socket.id;

    if (!isWhite && !isBlack) {
      socket.emit("error", "You are not in this game");
      return;
    }

    game.moves.push({ player: socket.id, move, timestamp: Date.now() });

    socket.to(roomCode).emit("opponentMove", move);
    console.log(`Move in game ${roomCode}: ${JSON.stringify(move)}`);
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    const roomCode = playerToGame.get(socket.id);
    if (roomCode) {
      const game = games.get(roomCode);
      if (game) {
        socket.to(roomCode).emit("opponentDisconnected");

        setTimeout(() => {
          const currentGame = games.get(roomCode);
          if (
            currentGame &&
            (currentGame.white === socket.id || currentGame.black === socket.id)
          ) {
            games.delete(roomCode);
            console.log(`Game ${roomCode} removed due to player disconnect`);
          }
        }, 30000);
      }
      playerToGame.delete(socket.id);
    }
  });
});

setInterval(() => {
  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000;

  for (const [roomCode, game] of games.entries()) {
    if (now - game.createdAt > twoHours) {
      games.delete(roomCode);
      console.log(`Cleaned up old game: ${roomCode}`);
    }
  }
}, 60000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chess server running on port ${PORT}`);
  console.log(`Active games: ${games.size}`);
  console.log(`Connected players: ${playerToGame.size}`);
});
