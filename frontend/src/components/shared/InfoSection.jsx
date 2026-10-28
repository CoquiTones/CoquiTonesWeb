import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

/**
 * Alternating image/text marketing section used on the home page.
 */
export default function InfoSection({
  id,
  eyebrow,
  topLine,
  headline,
  description,
  buttonLabel,
  buttonRoute,
  image,
  img,
  imageAlt,
  alt,
  imageSide = 'right',
  imgStart = false,
  tone = 'dark',
}) {
  const headingId = `${id}-heading`;
  const side = imgStart ? 'left' : imageSide;
  const isImageLeft = side === 'left';
  const resolvedImage = image ?? img;
  const resolvedAlt = imageAlt ?? alt ?? '';

  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={headingId}
      sx={{
        py: { xs: 7, md: 11 },
        backgroundColor: tone === 'raised' ? 'background.paper' : 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 5, md: 9 },
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              order: { xs: 1, md: isImageLeft ? 1 : 2 },
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            }}
          >
            <Box
              component="img"
              src={resolvedImage}
              alt={resolvedAlt}
              loading="lazy"
              decoding="async"
              sx={{ width: '100%', height: 'auto', display: 'block', borderRadius: 3 }}
            />
          </Box>

          <Box sx={{ order: { xs: 2, md: isImageLeft ? 2 : 1 }, maxWidth: 560 }}>
            <Typography component="p" variant="overline" sx={{ color: 'secondary.light', mb: 1.5 }}>
              {eyebrow ?? topLine}
            </Typography>
            <Typography component="h2" id={headingId} variant="h2" color="text.primary">
              {headline}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2.5, mb: 4 }}>
              {description}
            </Typography>
            {buttonLabel && buttonRoute && (
              <Button
                component={RouterLink}
                to={buttonRoute}
                variant={tone === 'raised' ? 'outlined' : 'contained'}
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                {buttonLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
