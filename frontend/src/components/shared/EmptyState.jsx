import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

/**
 * Consistent empty/zero-data state for panels and tables.
 */
export default function EmptyState({ icon, title, description, action, minHeight = 240 }) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
        p: 3,
      }}
    >
      <Box aria-hidden="true" sx={{ color: 'text.secondary', display: 'flex', '& svg': { fontSize: 40 } }}>
        {icon ?? <InboxRoundedIcon />}
      </Box>
      <Typography component="p" variant="subtitle1" color="text.primary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
