import path from "path";
import dotenv from "dotenv";
import { createApp } from "./app";

const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRoot, ".env.development") });
dotenv.config({ path: path.join(backendRoot, ".env") });

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(
    `FeastPilot backend listening on http://localhost:${PORT} (${process.env.NODE_ENV ?? "unknown"})`
  );
});
