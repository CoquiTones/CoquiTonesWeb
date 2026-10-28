import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

/**
 * Standard page header for workspace pages (no hero media).
 */
export default function PageHeader({ eyebrow, title, description, actions, children, maxWidth = 'lg' }) {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 4, md: 6 },
        pb: { xs: 3, md: 4 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.default',
      }}
      aria-labelledby="page-header-title"
    >
      <Container maxWidth={maxWidth}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ maxWidth: 720 }}>
            {eyebrow && (
              <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
                {eyebrow}
              </Typography>
            )}
            <Typography component="h1" id="page-header-title" variant="h2">
              {title}
            </Typography>
            {description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
                {description}
              </Typography>
            )}
          </Box>
          {actions && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box>}
        </Box>
        {children}
      </Container>
    </Box>
  );
}
