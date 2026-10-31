DROP TYPE IF EXISTS node_type CASCADE;
DROP TABLE IF EXISTS annotationslice CASCADE;
DROP TABLE IF EXISTS annotationreport CASCADE;
DROP TABLE IF EXISTS appuser CASCADE;
DROP TABLE IF EXISTS node CASCADE;
DROP TABLE IF EXISTS timestampindex CASCADE;
DROP TABLE IF EXISTS audiofile CASCADE;
DROP TABLE IF EXISTS weatherdata CASCADE;
DROP TABLE IF EXISTS audioslice CASCADE;

CREATE TYPE node_type AS ENUM ('primary', 'secondary');

-- ============================================
-- USER TABLE
-- ============================================
CREATE TABLE appuser (
    auid        SERIAL PRIMARY KEY,
    username    VARCHAR(30) NOT NULL,
    salt        bytea NOT NULL,
    pwhash      bytea NOT NULL,
    UNIQUE (username)
);

-- Index for username lookups (login)
CREATE INDEX idx_appuser_username ON appuser(username);

-- ============================================
-- NODE TABLE
-- ============================================
CREATE TABLE node (
    nid         SERIAL PRIMARY KEY,
    nname       VARCHAR(30) NOT NULL,
    ownerid     INTEGER REFERENCES appuser(auid) ON DELETE CASCADE,
    ntype       node_type NOT NULL,
    nlatitude   REAL NOT NULL,
    nlongitude  REAL NOT NULL,
    ndescription VARCHAR(512),
    UNIQUE (nname)
);

-- Index for finding nodes by owner (for user dashboards)
CREATE INDEX idx_node_ownerid ON node(ownerid);

-- Index for geographic queries (nearby nodes)
CREATE INDEX idx_node_location ON node(nlatitude, nlongitude);

-- ============================================
-- TIMESTAMP INDEX TABLE
-- ============================================
CREATE TABLE timestampindex (
    tid         SERIAL PRIMARY KEY,
    nid         INTEGER REFERENCES node(nid) ON DELETE CASCADE,
    ttime       TIMESTAMP NOT NULL
);

-- Index for finding timestamps by node
CREATE INDEX idx_timestampindex_nid ON timestampindex(nid);

-- Index for time-based queries (date ranges)
CREATE INDEX idx_timestampindex_ttime ON timestampindex(ttime);

-- Composite index for node + time queries
CREATE INDEX idx_timestampindex_nid_ttime ON timestampindex(nid, ttime);

-- ============================================
-- AUDIO FILE TABLE
-- ============================================
CREATE TABLE audiofile (
    afid        SERIAL PRIMARY KEY,
    ownerid     INTEGER REFERENCES appuser(auid) ON DELETE CASCADE,
    tid         INTEGER REFERENCES timestampindex(tid) ON DELETE CASCADE,
    data        bytea NOT NULL
);

-- Index for finding audio files by owner
CREATE INDEX idx_audiofile_ownerid ON audiofile(ownerid);

-- Index for finding audio files by timestamp (critical for joins)
CREATE INDEX idx_audiofile_tid ON audiofile(tid);

-- Composite index for owner + timestamp queries
CREATE INDEX idx_audiofile_ownerid_tid ON audiofile(ownerid, tid);

-- ============================================
-- WEATHER DATA TABLE
-- ============================================
CREATE TABLE weatherdata (
    wdid            SERIAL PRIMARY KEY,
    tid             INTEGER REFERENCES timestampindex(tid) ON DELETE CASCADE,
    wdtemperature   REAL,
    wdhumidity      REAL,
    wdpressure      REAL,
    wdDid_rain      bool
);

-- Index for finding weather data by timestamp (critical for joins)
CREATE INDEX idx_weatherdata_tid ON weatherdata(tid);

-- ============================================
-- AUDIO SLICE TABLE
-- ============================================
CREATE TABLE audioslice (
    asid        SERIAL PRIMARY KEY,
    afid        INTEGER REFERENCES audiofile(afid) ON DELETE CASCADE,
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

-- Index for finding audio slices by audio file (critical for joins)
CREATE INDEX idx_audioslice_afid ON audioslice(afid);

-- ============================================
-- MANUAL ANNOTATION REPORT TABLES
-- ============================================
CREATE TABLE annotationreport (
    arid        SERIAL PRIMARY KEY,
    afid        INTEGER NOT NULL REFERENCES audiofile(afid) ON DELETE CASCADE,
    ownerid     INTEGER NOT NULL REFERENCES appuser(auid) ON DELETE CASCADE,
    savedat     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_annotationreport_latest
    ON annotationreport (afid, ownerid, savedat DESC, arid DESC);

CREATE TABLE annotationslice (
    anid            SERIAL PRIMARY KEY,
    arid            INTEGER NOT NULL REFERENCES annotationreport(arid) ON DELETE CASCADE,
    windowindex     INTEGER NOT NULL CHECK (windowindex >= 0),
    starttime       INTERVAL NOT NULL,
    endtime         INTERVAL NOT NULL,
    coqui           BOOLEAN NOT NULL,
    wightmanae      BOOLEAN NOT NULL,
    gryllus         BOOLEAN NOT NULL,
    portoricensis   BOOLEAN NOT NULL,
    unicolor        BOOLEAN NOT NULL,
    hedricki        BOOLEAN NOT NULL,
    locustus        BOOLEAN NOT NULL,
    richmondi       BOOLEAN NOT NULL,
    CONSTRAINT annotationslice_window_start
        CHECK (starttime = windowindex * INTERVAL '10 seconds'),
    CONSTRAINT annotationslice_window_duration
        CHECK (endtime > starttime AND endtime - starttime <= INTERVAL '10 seconds'),
    CONSTRAINT annotationslice_report_window_unique UNIQUE (arid, windowindex)
);

CREATE INDEX idx_annotationslice_arid ON annotationslice(arid);

-- ============================================
-- CASCADE DELETE CHAIN VERIFICATION
-- ============================================
-- Deleting timestampindex will cascade to:
--   1. audiofile (via tid FK) -> CASCADE
--   2. weatherdata (via tid FK) -> CASCADE
--   3. audioslice (via audiofile deletion) -> CASCADE
--   4. annotationreport (via audiofile deletion) -> annotationslice
--
-- Full chain when deleting a timestampindex (tid):
--   timestampindex (tid) 
--     -> audiofile (via tid) 
--       -> audioslice (via afid)
--       -> annotationreport (via afid)
--         -> annotationslice (via arid)
--     -> weatherdata (via tid)
