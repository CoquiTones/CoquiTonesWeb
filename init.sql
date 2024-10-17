DROP TYPE IF EXISTS node_type;
DROP TABLE IF EXISTS node;
DROP TABLE IF EXISTS timestampindex;
DROP TABLE IF EXISTS audiofile;
DROP TABLE IF EXISTS weatherdata;
DROP TABLE IF EXISTS classifierreport;

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

CREATE TABLE classifierreport (
    crid                SERIAL PRIMARY KEY,
    tid                 INTEGER REFERENCES timestampindex,
    crsamples           INTEGER NOT NULL,
    crcoqui_common      INTEGER NOT NULL,
    crcoqui_e_monensis  INTEGER NOT NULL,
    crcoqui_antillensis INTEGER NOT NULL,
    crno_hit            INTEGER NOT NULL
);

CREATE TABLE audiofile (
    afid        SERIAL PRIMARY KEY,
    tid         INTEGER REFERENCES  timestampindex,
    data        pg_largeobject NOT NULL
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

INSERT INTO timestampindex (nid, ttime)
    VALUES 
        (1, TO_TIMESTAMP(
    '2017-03-31 9:30:20',
    'YYYY-MM-DD HH:MI:SS'));

INSERT INTO weatherdata (tid, wdtemperature, wdhumidity, wdpressure, wddid_rain)
VALUES
    (1, 75.4, 45.5, 1000, true);



