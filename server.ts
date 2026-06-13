import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import fs from 'fs';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = 3000;

app.use(express.json());

// Load combinations data
let combinations = [];
try {
  const data = fs.readFileSync(path.join(process.cwd(), 'src/data/combinations.json'), 'utf8');
  combinations = JSON.parse(data);
} catch (e) {
  console.error("Failed to load combinations", e);
}

// Simple in-memory leaderboard (persisted to a file)
const leaderboardPath = path.join(process.cwd(), 'leaderboard.json');
let leaderboard: { name: string, score: number, date: string }[] = [];
try {
  if (fs.existsSync(leaderboardPath)) {
    leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
  }
} catch (e) {
  console.error("Failed to load leaderboard", e);
}

const saveLeaderboard = () => {
  try {
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard));
  } catch(e) {}
};

app.get('/api/leaderboard', (req, res) => {
  // Return top 20
  const top = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
  res.json(top);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') return res.status(400).json({error: 'Invalid'});
  leaderboard.push({ name: name.substring(0, 20), score, date: new Date().toISOString() });
  saveLeaderboard();
  res.json({ success: true });
});

// Multiplayer Game State
const rooms = new Map<string, {
  id: string,
  players: { id: string, name: string, score: number, ready: boolean }[],
  state: 'waiting' | 'playing' | 'finished',
  currentRound: number,
  rounds: any[],
  timeRemaining: number,
  optionsCount: number,
}>();

const generateRounds = (count: number, optionsCount: number) => {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    let target = combinations[Math.floor(Math.random() * combinations.length)];
    while (target.leftEmoji === target.rightEmoji) {
      target = combinations[Math.floor(Math.random() * combinations.length)];
    }
    
    // pick random distractors
    const pool = new Set([target.leftEmoji, target.rightEmoji]);
    while (pool.size < optionsCount) {
      const r = combinations[Math.floor(Math.random() * combinations.length)];
      pool.add(r.leftEmoji);
      pool.add(r.rightEmoji);
    }
    const options = Array.from(pool).slice(0, optionsCount).sort(() => Math.random() - 0.5);
    rounds.push({
      targetImg: target.url,
      options,
      correct: [target.leftEmoji, target.rightEmoji]
    });
  }
  return rounds;
};

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, name, optionsCount }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        players: [],
        state: 'waiting',
        currentRound: 0,
        rounds: [],
        timeRemaining: 0,
        optionsCount: optionsCount || 16
      });
    }
    const room = rooms.get(roomId)!;
    if (room.players.length >= 2 || room.state !== 'waiting') {
      socket.emit('room_error', 'Room full or already started');
      return;
    }
    room.players.push({ id: socket.id, name, score: 0, ready: false });
    io.to(roomId).emit('room_update', room);
  });

  socket.on('ready', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const p = room.players.find(p => p.id === socket.id);
    if (p) p.ready = true;
    io.to(roomId).emit('room_update', room);

    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      room.state = 'playing';
      room.rounds = generateRounds(10, room.optionsCount);
      room.currentRound = 0;
      io.to(roomId).emit('game_start', room);
    }
  });

  socket.on('submit_guess', ({ roomId, guess }) => {
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    
    const currentRound = room.rounds[room.currentRound];
    const isCorrect = guess.length === 2 && guess.every((e: string) => currentRound.correct.includes(e));
    
    if (isCorrect) {
      const p = room.players.find(p => p.id === socket.id);
      if (p) p.score += 10;
      
      room.currentRound++;
      if (room.currentRound >= room.rounds.length) {
        room.state = 'finished';
        io.to(roomId).emit('game_finished', room);
      } else {
        io.to(roomId).emit('round_won', { winner: socket.id, nextRound: room.currentRound, room });
      }
    } else {
      socket.emit('guess_incorrect');
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          room.state = 'finished'; // end game if someone leaves
          io.to(roomId).emit('player_left', room);
        }
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
