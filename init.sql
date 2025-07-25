DROP TYPE IF EXISTS node_type CASCADE;
DROP TABLE IF EXISTS node CASCADE;
DROP TABLE IF EXISTS timestampindex CASCADE;
DROP TABLE IF EXISTS audiofile CASCADE;
DROP TABLE IF EXISTS weatherdata CASCADE;
DROP TABLE IF EXISTS audioslice CASCADE;

CREATE TYPE node_type AS ENUM ('primary', 'secondary');

CREATE TABLE node (
    nid         SERIAL PRIMARY KEY,
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

INSERT INTO node (ntype, nlatitude, nlongitude, ndescription)
VALUES 
    ('primary',18.0814,-66.9038,'Bosque Susua'),
    ('primary',18.1504,-66.9869,'Bosque Estatal Maricao'),
    ('secondary',18.4103,-66.0944,'Bosque San Patricio'),
    ('primary',18.2201,-66.5283,'Bosque Los Tres Picachos');