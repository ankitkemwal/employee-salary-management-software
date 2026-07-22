import "dotenv/config";
import { createApp } from "./app";
import { initSchema } from "./db/init";

initSchema();

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`ACME salary API listening on http://localhost:${port}`);
});
