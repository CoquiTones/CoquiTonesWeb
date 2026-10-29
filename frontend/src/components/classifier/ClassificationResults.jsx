import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

import { SPECIES } from './species';
import ClassificationWaveform from './ClassificationWaveform';
import { downloadCsv, toCsv } from '../../utils/format';

/**
 * Paginated classification report with CSV export.
 */
export default function ClassificationResults({ report, fileName, audioFile }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const slices = useMemo(() => (report ? report.slice(0, report.length) : []), [report]);
  const paginatedSlices = slices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const detectedCounts = useMemo(
    () =>
      SPECIES.reduce((totals, species) => {
        totals[species.key] = slices.filter((slice) => slice[species.key]).length;
        return totals;
      }, {}),
    [slices],
  );

  const handleExportCsv = () => {
    const csv = toCsv(
      ['Start (s)', 'End (s)', ...SPECIES.map((species) => species.label)],
      slices.map((slice) => [
        slice.start_time,
        slice.end_time,
        ...SPECIES.map((species) => (slice[species.key] ? 'Detected' : 'Not found')),
      ]),
    );
    downloadCsv(`classification_${fileName?.replace(/\.[^.]+$/, '') ?? 'report'}.csv`, csv);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          <Typography component="h2" variant="h6" color="text.primary">
            Classification report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {slices.length} time slice{slices.length === 1 ? '' : 's'}
            {fileName ? ` · ${fileName}` : ''}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={handleExportCsv}>
          Export CSV
        </Button>
      </Box>

      <ClassificationWaveform slices={slices} audioFile={audioFile} fileName={fileName} />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}
        aria-label="Detected slices per species"
      >
        {SPECIES.map((species) => (
          <Chip
            key={species.key}
            size="small"
            variant={detectedCounts[species.key] > 0 ? 'filled' : 'outlined'}
            color={detectedCounts[species.key] > 0 ? 'success' : 'default'}
            label={`${species.label}: ${detectedCounts[species.key]}`}
          />
        ))}
      </Box>

      <TableContainer sx={{ maxHeight: 560 }}>
        <Table stickyHeader size="small" aria-label="Classification results by time slice">
          <TableHead>
            <TableRow>
              <TableCell>Time slice</TableCell>
              {SPECIES.map((species) => (
                <TableCell key={species.key} align="center">
                  {species.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSlices.map((slice, index) => (
              <TableRow key={`${slice.start_time}-${slice.end_time}-${page * rowsPerPage + index}`} hover>
                <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {slice.start_time}s – {slice.end_time}s
                </TableCell>
                {SPECIES.map((species) => {
                  const isDetected = Boolean(slice[species.key]);
                  return (
                    <TableCell key={species.key} align="center">
                      <Chip
                        size="small"
                        variant={isDetected ? 'filled' : 'outlined'}
                        color={isDetected ? 'success' : 'default'}
                        label={isDetected ? 'Detected' : 'Not found'}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={slices.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
      />
    </Box>
  );
}

ClassificationResults.propTypes = {
  report: PropTypes.shape({
    length: PropTypes.number.isRequired,
    slice: PropTypes.func.isRequired,
  }).isRequired,
  fileName: PropTypes.string,
  audioFile: PropTypes.instanceOf(File),
};
