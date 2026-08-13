require("dotenv").config({ path: ".env", override: true });
const { spawn } = require("child_process");

const port = process.env.PORT || "3111";
const child = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
