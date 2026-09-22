-- One row per colo per hour. Counters only: no IP, no user agent, nothing that
-- identifies a visitor. Cloudflare has already resolved the request to a colo
-- at the edge, so there is nothing to geolocate and nothing to store.
CREATE TABLE IF NOT EXISTS hits (
  colo   TEXT    NOT NULL,
  bucket INTEGER NOT NULL,            -- unix hour
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (colo, bucket)
);
CREATE INDEX IF NOT EXISTS hits_bucket ON hits (bucket);

-- Beta applications. Unique on email so a double submit updates rather than
-- duplicates, and so the same person refreshing does not look like demand.
CREATE TABLE IF NOT EXISTS beta_applications (
  email     TEXT PRIMARY KEY,
  created   INTEGER NOT NULL,
  name      TEXT NOT NULL,
  company   TEXT,
  site      TEXT,
  zones     TEXT NOT NULL,
  traffic   TEXT NOT NULL,
  plans     TEXT,               -- comma-joined: free,pro,business,enterprise
  focus     TEXT,               -- comma-joined: security,dns,performance,investigation,reporting
  role      TEXT,
  today     TEXT,
  anthropic TEXT,
  colo      TEXT,
  country   TEXT
);
CREATE INDEX IF NOT EXISTS beta_created ON beta_applications (created);
