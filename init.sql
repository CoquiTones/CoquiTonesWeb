DROP TYPE IF EXISTS node_type CASCADE;
DROP TABLE IF EXISTS appuser CASCADE;
DROP TABLE IF EXISTS node CASCADE;
DROP TABLE IF EXISTS timestampindex CASCADE;
DROP TABLE IF EXISTS audiofile CASCADE;
DROP TABLE IF EXISTS weatherdata CASCADE;
DROP TABLE IF EXISTS audioslice CASCADE;

CREATE TYPE node_type AS ENUM ('primary', 'secondary');

CREATE TABLE appuser (
    auid        SERIAL PRIMARY KEY,
    username    VARCHAR(30) NOT NULL,
    salt        bytea NOT NULL,
    pwhash      bytea NOT NULL,
    UNIQUE (username)
);

CREATE TABLE node (
    nid         SERIAL PRIMARY KEY,
    ownerid     INTEGER REFERENCES appuser ON DELETE CASCADE,
    ntype       node_type NOT NULL,
    nlatitude   REAL NOT NULL,
    nlongitude  REAL NOT NULL,
    ndescription VARCHAR(512)
);

CREATE TABLE timestampindex (
    tid         SERIAL PRIMARY KEY,
    nid         INTEGER REFERENCES node ON DELETE CASCADE,
    ttime       TIMESTAMP NOT NULL
);

-- future refactor of audioSlice and species detection
-- CREATE TABLE species_detection (
--     sdid        SERIAL PRIMARY KEY,
--     afid        INTEGER NOT NULL REFERENCES audiofile ON DELETE CASCADE,
--     species     VARCHAR(50) NOT NULL,
--     confidence  REAL CHECK (confidence >= 0 AND confidence <= 1),
--     start_ms    INTEGER NOT NULL,
--     end_ms      INTEGER NOT NULL,
--     INDEX (afid),
--     INDEX (species)
-- );

CREATE TABLE audiofile (
    afid        SERIAL PRIMARY KEY,
    ownerid     INTEGER REFERENCES appuser ON DELETE CASCADE,
    tid         INTEGER REFERENCES timestampindex ON DELETE CASCADE,
    data        bytea NOT NULL
);

CREATE TABLE audioslice (
    asid        SERIAL PRIMARY KEY,
    afid        INTEGER REFERENCES audiofile ON DELETE CASCADE,
    starttime   INTERVAL,
    endtime     INTERVAL,
    coqui       bool,
    wightmanae  bool,
    gryllus     bool,
    portoricensis   bool,
    unicolor    bool,
    hedricki    bool,
    locustus    bool,
    richmondi   bool
);

CREATE TABLE weatherdata (
    wdid            SERIAL PRIMARY KEY,
    tid             INTEGER REFERENCES timestampindex ON DELETE CASCADE,
    wdtemperature   REAL,
    wdhumidity      REAL,
    wdpressure      REAL,
    wddid_rain      bool
);
