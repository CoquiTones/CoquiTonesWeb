DROP TYPE IF EXISTS node_type;

DROP TABLE IF EXISTS node;

DROP TABLE IF EXISTS timestampindex;

DROP TABLE IF EXISTS audiofile;

DROP TABLE IF EXISTS weatherdata;

DROP TABLE IF EXISTS classifierreport;

CREATE TYPE node_type AS ENUM ('primary', 'secondary');

CREATE TABLE node (
    nid SERIAL PRIMARY KEY,
    ntype node_type NOT NULL,
    nlatitude REAL NOT NULL,
    nlongitude REAL NOT NULL,
    ndescription VARCHAR(512)
);

CREATE TABLE timestampindex (
    tid SERIAL PRIMARY KEY,
    nid INTEGER REFERENCES node,
    ttime TIMESTAMP NOT NULL
);

CREATE TABLE audiofile (
    afid SERIAL PRIMARY KEY,
    tid INTEGER REFERENCES timestampindex,
    nid INTEGER REFERENCES node,
    data bytea NOT NULL
);

CREATE TABLE classifierreport (
    crid SERIAL PRIMARY KEY,
    tid INTEGER REFERENCES timestampindex,
    afid INTEGER REFERENCES audiofile,
    cr_common_coqui_detected INTEGER NOT NULL,
    cr_coqui_gryllus_detected INTEGER NOT NULL,
    cr_coqui_locustus_detected INTEGER NOT NULL,
    cr_coqui_portoricensis_detected INTEGER NOT NULL,
    cr_coqui_unicolor_detected INTEGER NOT NULL,
    cr_coqui_hedricki_detected INTEGER NOT NULL,
    cr_coqui_richmondi_detected INTEGER NOT NULL,
    cr_coqui_wightmanae_detected INTEGER NOT NULL
);

CREATE TABLE weatherdata (
    wdid SERIAL PRIMARY KEY,
    tid INTEGER REFERENCES timestampindex,
    nid INTEGER REFERENCES node,
    wdtemperature REAL,
    wdhumidity REAL,
    wdpressure REAL,
    wddid_rain bool
);

INSERT INTO
    node (
        ntype,
        nlatitude,
        nlongitude,
        ndescription
    )
VALUES (
        'primary',
        18.0814,
        -66.9038,
        'Bosque Susua'
    ),
    (
        'primary',
        18.1504,
        -66.9869,
        'Bosque Estatal Maricao'
    ),
    (
        'secondary',
        18.4103,
        -66.0944,
        'Bosque San Patricio'
    ),
    (
        'primary',
        18.2201,
        -66.5283,
        'Bosque Los Tres Picachos'
    );