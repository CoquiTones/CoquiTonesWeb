import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';

import logo from '../assets/images/logo512.png';
import { NAV_ITEMS, PROJECT_REPOSITORY } from '../../config/navigation';

const linkSx = {
  color: 'text.secondary',
  typography: 'body2',
  textDecoration: 'none',
  width: 'fit-content',
  '&:hover': { color: 'primary.main' },
};

export default function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', mt: 'auto' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 6 }}
          justifyContent="space-between"
        >
          <Box sx={{ maxWidth: 360 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box component="img" src={logo} alt="" sx={{ width: 36, height: 36 }} />
              <Typography component="p" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'primary.main' }}>
                CoquiTones
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Open-source acoustic monitoring for amphibian conservation, built with Proyecto Coquí.
            </Typography>
          </Box>

          <Box
            component="nav"
            aria-label="Footer"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, minmax(140px, auto))' }, gap: 1.5 }}
          >
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} component={RouterLink} to={item.to} sx={linkSx}>
                {item.label}
              </Link>
            ))}
            <Link component={RouterLink} to="/SignUp" sx={linkSx}>
              Create account
            </Link>
            <Link href={PROJECT_REPOSITORY} target="_blank" rel="noopener noreferrer" sx={linkSx}>
              Source code
            </Link>
          </Box>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} CoquiTones. All rights reserved.
          </Typography>
          <IconButton
            component="a"
            href={PROJECT_REPOSITORY}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CoquiTones on GitHub (opens in a new tab)"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <GitHubIcon />
          </IconButton>
        </Stack>
      </Container>
    </Box>
  );
}
