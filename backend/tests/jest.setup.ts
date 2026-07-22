// Every test file gets its own module registry (and therefore its own
// node:sqlite connection) from Jest, so an in-memory DB per file gives
// full isolation between test files with no cleanup between runs needed.
process.env.DATABASE_URL = ":memory:";
process.env.CORS_ORIGIN = "*";
