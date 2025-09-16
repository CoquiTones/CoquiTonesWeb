DROP TYPE IF EXISTS node_type CASCADE;
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
)

CREATE TABLE node (
    nid         SERIAL PRIMARY KEY,
    ownerid     INTEGER REFERENCES appuser
    ntype       node_type NOT NULL,
    nlatitude   REAL NOT NULL,
    nlongitude  REAL NOT NULL,
    ndescription VARCHAR(512)
);

CREATE TABLE timestampindex (
    tid         SERIAL PRIMARY KEY,
    nid         INTEGER REFERENCES node,
    ttime       TIMESTAMP NOT NULL
);


CREATE TABLE audiofile (
    afid        SERIAL PRIMARY KEY,
    tid         INTEGER REFERENCES  timestampindex,
    data        bytea NOT NULL
);

CREATE TABLE audioslice (
    asid        SERIAL PRIMARY KEY,
    afid        INTEGER REFERENCES timestampindex,
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
    tid             INTEGER REFERENCES timestampindex,
    wdtemperature   REAL,
    wdhumidity      REAL,
    wdpressure      REAL,
    wddid_rain      bool
);