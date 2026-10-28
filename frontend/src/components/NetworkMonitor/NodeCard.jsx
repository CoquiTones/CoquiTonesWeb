import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

/**
 * One IoT node: identity, coordinates and MQTT client provisioning.
 */
export default function NodeCard({
  node,
  needsClient,
  password,
  onPasswordChange,
  onCreateClient,
  syncing = false,
  failed = false,
}) {
  const titleId = `node-${node.nid}-title`;

  return (
    <Paper
      component="article"
      aria-labelledby={titleId}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
        backgroundColor: 'background.paper',
        transition: 'border-color 150ms ease',
        '&:hover': { borderColor: 'divider' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" id={titleId} variant="h5" color="primary" sx={{ wordBreak: 'break-word' }}>
            Node {node.nid}
          </Typography>
          {node.nname && (
            <Typography variant="body2" color="text.secondary">
              {node.nname}
            </Typography>
          )}
        </Box>
        <Chip
          size="small"
          variant="outlined"
          color={needsClient ? 'warning' : 'success'}
          icon={needsClient ? <WarningAmberRoundedIcon /> : <CheckCircleRoundedIcon />}
          label={needsClient ? 'MQTT pending' : 'Connected'}
        />
      </Box>

      <Box component="dl" sx={{ m: 0, mt: 1, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 0.75, columnGap: 2 }}>
        <Typography component="dt" variant="body2" color="text.secondary">
          Type
        </Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0, textTransform: 'capitalize' }}>
          {node.ntype || '—'}
        </Typography>

        <Typography component="dt" variant="body2" color="text.secondary">
          Description
        </Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0 }}>
          {node.ndescription || '—'}
        </Typography>

        <Typography component="dt" variant="body2" color="text.secondary">
          Coordinates
        </Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0, fontFamily: 'monospace' }}>
          {node.hasLocation ? `${Number(node.nlatitude).toFixed(4)}, ${Number(node.nlongitude).toFixed(4)}` : 'Not set'}
        </Typography>
      </Box>

      {needsClient ? (
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateClient();
          }}
          sx={{ mt: 'auto', pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          <TextField
            required
            size="small"
            fullWidth
            label="MQTT client password"
            type="password"
            autoComplete="new-password"
            value={password ?? ''}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={syncing}
            helperText="Must match the password flashed to this node."
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button type="submit" variant="contained" disabled={syncing || !password}>
              Create MQTT client
            </Button>
            {syncing && <CircularProgress size={22} aria-label="Creating MQTT client" />}
            {failed && !syncing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                <ErrorOutlineRoundedIcon fontSize="small" />
                <Typography variant="caption">Failed — try again</Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleRoundedIcon fontSize="small" />
          <Typography variant="body2">MQTT client created</Typography>
        </Box>
      )}
    </Paper>
  );
}
