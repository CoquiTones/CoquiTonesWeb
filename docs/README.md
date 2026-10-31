# Deploy Local Development Environment

## Requirements

- Docker CLI and Docker compose
- Python: tested with: [3.11.14 (docker version), 3.11.9]
- mapbox api key
- openssl (linux or wsl for windows)
- Recommendation: Use VScode Docker Extension to use docker compose commands

## Step 1: Configure Environment Variables

- modify the [.env environment file in FRONTEND](../frontend/.env.template) accordingly and save a copy without the ".template" extension.
- modify the [.env environment file in BACKEND](../backend/src/.env.template) accordingly and save a copy without the ".template" extension.
- generate localhost.crt and localhost.key in root of project running this command in root of project:

    ```bash
    openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
  ```

## Optional Step: [Run Machine Learning notebook to generate model](../machine_learning/prepare_data_and_train_model.ipynb)

Note: This step requires you have jupyter dependencies installed

## Step 2: Development Deployment using Docker Compose

Simply `docker compose up -d --build`

Or use the launcher script, which rebuilds the images, waits for the backend,
and follows the container logs (`Ctrl+C` stops the stack):

```bash
./scripts/launch.sh              # rebuild + start + follow logs
./scripts/launch.sh --no-build   # restart with the existing images
```

The app is then available at:

- <https://localhost:5173> — frontend dev server
- <https://localhost:8080> — backend API and built frontend

### Annotation schema upgrade for existing databases

Fresh database volumes get the annotation tables from [`init.sql`](../init.sql). If you already
have a PostgreSQL volume, apply the additive migration once:

```bash
docker compose exec -T database psql -U postgres -d postgres \
  < scripts/migrations/001_add_annotation_tables.sql
```

The migration creates `annotationreport` and `annotationslice` without dropping existing data.
It is safe to run again because the table and index creation use `IF NOT EXISTS`.

### Annotating spectral windows

The Spectral Analysis page splits the loaded recording into contiguous ten-second windows.
Hovering a window previews it on the spectrogram; click, tap, or press Enter/Space on the
focused plot to pin it. The **Reported** view is read-only and the **Editor** view toggles the
eight species flags for the pinned window.

The authoritative report is resolved per signed-in user:

1. **Manual** — that user's most recent saved report for the recording. Manual reports are
   private and are stored separately from classifier output.
2. **Classifier** — the existing `audioslice` rows when the user has no manual report. Rows
   that do not align with the ten-second grid are skipped and a warning is shown.
3. **None** — every species is absent when neither source exists.

Local uploads can be annotated and exported immediately. To save annotations, first use the
save button in the toolbar to persist the recording to the database; the recording then gains
an `afid` and the in-progress draft is preserved. Saving annotations requires a signed-in
session and a database-backed recording. If a newer report was saved in another tab, the
conflict dialog offers **Reload latest** or an explicit **Overwrite**; it never overwrites
silently. Browser unloads, internal navigation, mode switches, and loading another recording
all prompt before discarding unsaved changes.

**Export annotations** downloads a timestamped JSON file derived from the recording name for
any loaded recording, including local-only ones. The export reflects the current on-screen
windows and sets `is_draft` when the values are local-only or contain unsaved edits.

### Demo data

`scripts/test/generate_mock_data.py` resets the annotation tables and sequences along with the
rest of the demo data. It creates ten-second-aligned classifier windows for a deterministic
subset of recordings and leaves the rest unclassified so both the **Classifier** and **None**
report sources can be reviewed.

## [Scripts](../scripts/)

**Scripts but only for based unix users.**
**Make sure to run this in root of project!!**

Example: `./scripts/build.sh`

[build.sh](../scripts/build.sh): setup backend installation, and frontend installation

[launch.sh](../scripts/launch.sh): rebuild and start the full Docker Compose stack (frontend, backend, database, MQTT), wait for the backend, and follow logs. `Ctrl+C` stops and removes the containers; pass `--no-build` to reuse existing images

[clean.sh](../scripts/clean.sh): removed all build files

[docker_deployment.sh](../scripts/docker_deployment.sh): deploy  docker using docker compose but also create logs for each container that can be found in ./logs/ \n

## Known Issues and Fixes

1. **Issue**: since we use development certificates for ssl connections, some browsers don't trust it. This leads to failed requests from frontend to backend. **To fix this:** boot the stack, open <https://localhost:8080> first, accept the certificate warning (this creates an exception for this address), then open <https://localhost:5173>.
