// Alternative to Docker: run with PM2 on the VPS (Postgres installed natively).
//   npm ci && npx next build && npx drizzle-kit migrate
//   pm2 start deploy/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "pure-conscious-healing",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname + "/..",
      env: { NODE_ENV: "production" },
      max_memory_restart: "800M",
    },
  ],
};
