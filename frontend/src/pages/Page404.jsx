import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import errorIllustration from '../components/assets/images/404Error.jpg';

export default function Page404() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
      <Box
        component="img"
        src={errorIllustration}
        alt=""
        aria-hidden="true"
        sx={{ width: '100%', maxWidth: 520, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}
      />
      <Typography component="h1" variant="h1" sx={{ mt: 5 }}>
        Page not found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mx: 'auto', maxWidth: 520 }}>
        The page you were looking for does not exist, or it may have moved. Check the address or head
        back to safety.
      </Typography>
      <Button
        component={RouterLink}
        to="/"
        variant="contained"
        size="large"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mt: 4 }}
      >
        Back to home
      </Button>
    </Container>
  );
}
