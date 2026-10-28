import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';

/**
 * Section heading used inside dashboard panels.
 */
export default function Title({ children, action }) {
  return (
    <Typography
      component="h2"
      variant="h6"
      color="text.primary"
      sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
    >
      <span>{children}</span>
      {action}
    </Typography>
  );
}

Title.propTypes = {
  children: PropTypes.node,
  action: PropTypes.node,
};
