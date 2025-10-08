import React, { useState } from 'react';
import { 
    Modal, 
    Box, 
    Typography, 
    TextField, 
    Button,
    Stack,
    Divider, 
    styled 
} from '@mui/material';
import logo from "../assets/images/logo512.png";

const ModalContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    backgroundColor: "#191716",
    border: '2px solid #000',
    boxShadow: 24,
    padding: theme.spacing(4),

    '& img': {
        width: '50%',
        height: '50%',
        display: 'flex',
        justifyContent: 'center',
        margin:'auto',
    }
}));

const SignInModal = ({ open, handleClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async () => {
    try {
      // Implement authentication logic here
      // You can use Toolpad Core's authentication methods
    } catch (error) {
      // Handle authentication errors
        console.error('Sign-in error:', error);
    }
};

    const handleSignUpClick = () => {
        handleClose();
        onSignUp && onSignUp();
    }

return (
    <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="sign-in-modal-title"
    >
        <ModalContainer>
            <img src={logo}></img>
        <Typography 
        id="sign-in-modal-title" 
        variant="h6" 
        component="h2" 
        align='center'
        sx={{
            color:"#ffc857",
            cursor: 'pointer',
            fontSize:'1.5rem',
            fontWeight: 'bold',
            TextDecoration:'none'
        }}>
            Sign In
        </Typography>
        <TextField
            fullWidth
            margin="normal"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
            fullWidth
            margin="normal"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />

        <Stack spacing={2} sx={{mt: 2}}>
            <Button 
            variant="contained" 
            onClick={handleSignIn}
            fullWidth
            sx={{ mt: 2 }}
        >
            Sign In
            </Button>
            <Divider>
            <Typography variant="body2" color="text.secondary">
                OR
            </Typography>
            </Divider>

            <Button 
            variant="outlined" 
            color="secondary"
            onClick={handleSignUpClick}
            fullWidth
            >
            Sign Up
            </Button>

            <Button 
            variant="text" 
            color="error"
            onClick={handleClose}
            fullWidth
            >
            Dismiss
            </Button>
        </Stack>
        </ModalContainer>
    </Modal>
    );
};

export default SignInModal;
