-- Additive migration for the spectral slice annotation feature.
-- Safe to run against an existing database; it never drops application data.

BEGIN;

CREATE TABLE IF NOT EXISTS annotationreport (
    arid        SERIAL PRIMARY KEY,
    afid        INTEGER NOT NULL REFERENCES audiofile(afid) ON DELETE CASCADE,
    ownerid     INTEGER NOT NULL REFERENCES appuser(auid) ON DELETE CASCADE,
    savedat     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annotationreport_latest
    ON annotationreport (afid, ownerid, savedat DESC, arid DESC);

CREATE TABLE IF NOT EXISTS annotationslice (
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

CREATE INDEX IF NOT EXISTS idx_annotationslice_arid ON annotationslice(arid);

COMMIT;
