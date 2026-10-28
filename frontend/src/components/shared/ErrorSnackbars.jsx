import { Alert, Button, Snackbar } from '@mui/material';
import { useErrors } from './ErrorContext';

/**
 * Renders every error currently held by `ErrorProvider` as a dismissible
 * snackbar. Mounted once in the app shell so pages never have to wire it up.
 */
export default function ErrorSnackbars() {
  const { errors, removeError } = useErrors();

  if (errors.length === 0) return null;

  return (
    <>
      {errors.map((error, index) => (
        <Snackbar
          key={error.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ top: { xs: `${12 + index * 84}px !important`, sm: `${80 + index * 72}px !important` } }}
        >
          <Alert
            severity="error"
            onClose={() => removeError(error.id)}
            action={
              <Button color="inherit" size="small" onClick={() => removeError(error.id)}>
                Dismiss
              </Button>
            }
            sx={{ alignItems: 'center', maxWidth: 560 }}
          >
            {error.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
