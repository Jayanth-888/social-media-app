import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// userId -> Set of socketIds. A Set (not a single id) because the same
// user can have the app open in multiple tabs/devices at once — we want
// to emit to all of them, and cleanly drop just the one that disconnects.
const userSocketMap = new Map<string, Set<string>>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  // Custom servers run as ONE long-lived Node process, so a plain
  // Node global is a safe, simple way to let API routes (running in
  // that same process) reach the io instance and the socket map.
  // This pattern does NOT work on serverless — each invocation there
  // gets its own fresh, empty global.
  (global as any).io = io;
  (global as any).userSocketMap = userSocketMap;

  // Auth middleware: every socket must present a valid short-lived JWT
  // (issued by GET /api/socket-token) before the connection is accepted.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Missing auth token"));

      const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as {
        id: string;
      };
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid or expired auth token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      socket.disconnect();
      return;
    }

    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)!.add(socket.id);

    console.log(`[socket] connected: user=${userId} socket=${socket.id}`);

    socket.on("disconnect", () => {
      const sockets = userSocketMap.get(userId);
      sockets?.delete(socket.id);
      if (sockets && sockets.size === 0) {
        userSocketMap.delete(userId);
      }
      console.log(`[socket] disconnected: user=${userId} socket=${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});