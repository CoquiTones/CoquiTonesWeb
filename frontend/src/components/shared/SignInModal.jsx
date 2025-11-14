import React, { useState } from 'react';
import {
	Modal,
	Box,
	Typography,
	TextField,
	Button,
	Stack,
	Divider,
	styled,
	Link
} from '@mui/material';
import logo from "../assets/images/logo512.png";
import { APIHandlerAuthentication } from '../../services/rest/APIHandler/APIHandlerAuthentication';
import { AuthenticateUserRequest } from '../../services/rest/RequestORM/Authentication/CheckUserRequest';


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
		margin: 'auto',
	}
}));

const SignInModal = ({ open, setOpen }) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSignIn = async () => {
		try {

			const handler = new APIHandlerAuthentication();
			const checkUserRequest = new AuthenticateUserRequest(username, password);
			const successfullyAuthenticatedStatus = await handler.setSessionTokenIfUserExists(checkUserRequest);

			if (successfullyAuthenticatedStatus) {
				alert('Successfully authenticated'); // obviously change this to something pretty 
				handleClose();
			}
			else {
				alert('incorrect username or password. Try again. ') // obviously change this to something pretty 
			}
		} catch (error) {
			// Handle authentication errors
			console.error('Sign-in error:', error);
		}
	};



	const handleClose = () => {

		setOpen(!open)
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
						color: "#ffc857",
						cursor: 'pointer',
						fontSize: '1.5rem',
						fontWeight: 'bold',
						TextDecoration: 'none'
					}}>
					Sign In
				</Typography>
				<TextField
					fullWidth
					margin="normal"
					label="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<TextField
					fullWidth
					margin="normal"
					type="password"
					label="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<Stack spacing={2} sx={{ mt: 2 }}>
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
						fullWidth
					>
						<Link href="/SignUp">
							Sign Up
						</Link>
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
