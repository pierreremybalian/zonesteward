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
