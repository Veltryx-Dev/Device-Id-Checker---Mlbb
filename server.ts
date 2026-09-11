import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to run python script for real generation & checking
function runPython(args: string[], inputData?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["lunaris.py", ...args]);
    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
      } else {
        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse python output: ${stdout}`));
        }
      }
    });

    if (inputData) {
      py.stdin.write(JSON.stringify(inputData));
    }
    py.stdin.end();
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { count = 10, brand = "random" } = req.body;
    const num = Math.min(Math.max(1, parseInt(count) || 1), 1000);
    const result = await runPython(["generate", String(num), String(brand)]);
    res.json(result);
  } catch (err: any) {
    console.error("Generate error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/check", async (req, res) => {
  try {
    const { device_ids } = req.body;
    if (!Array.isArray(device_ids) || device_ids.length === 0) {
      return res.status(400).json({ error: "device_ids array required" });
    }

    // Support up to 1,000,000 by slicing/batching up to 1000 at once
    const maxBatch = Math.min(device_ids.length, 1000);
    const batchIds = device_ids.slice(0, maxBatch);

    const result = await runPython(["check"], { device_ids: batchIds });
    res.json(result);
  } catch (err: any) {
    console.error("Check error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live streaming batch check endpoint supporting up to 1M items with SSE
app.post("/api/check-stream", async (req, res) => {
  try {
    const { device_ids } = req.body;
    if (!Array.isArray(device_ids) || device_ids.length === 0) {
      return res.status(400).json({ error: "device_ids array required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chunkSize = 150;
    const total = device_ids.length;
    let processed = 0;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = device_ids.slice(i, i + chunkSize);
      try {
        const result = await runPython(["check"], { device_ids: chunk });
        if (result.success && Array.isArray(result.results)) {
          processed += chunk.length;
          res.write(`data: ${JSON.stringify({
            success: true,
            results: result.results,
            progress: { processed, total }
          })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({
            success: false,
            error: "Python processing error for chunk",
            progress: { processed: processed + chunk.length, total }
          })}\n\n`);
        }
      } catch (chunkErr: any) {
        res.write(`data: ${JSON.stringify({
          success: false,
          error: chunkErr.message,
          progress: { processed: processed + chunk.length, total }
        })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Stream check error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ success: false, error: err.message })}\n\n`);
      res.end();
    }
  }
});



// Telegram notification endpoint
app.post("/api/telegram-notify", async (req, res) => {
  try {
    const { bot_token, chat_id, message } = req.body;
    if (!bot_token || !chat_id || !message) {
      return res.status(400).json({ success: false, error: "bot_token, chat_id, and message required" });
    }

    const tgUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    const response = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    if (data.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: data.description || "Telegram API error" });
    }
  } catch (err: any) {
    console.error("Telegram notify error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
