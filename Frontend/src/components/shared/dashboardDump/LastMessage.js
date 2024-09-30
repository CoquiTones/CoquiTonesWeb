import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from '../Title';

function preventDefault(event) {
	event.preventDefault();
}

export default function Heartbeats() {

	const getDate = () => {
		const today = new Date();
		const month = today.getMonth() + 1;
		const year = today.getFullYear();
		const date = today.getDate();
		return `${month}/${date}/${year}`;
	}
	const [date, setDate] = React.useState(getDate())
	return (
		<React.Fragment>
			<Title>Latest Message</Title>
			<Typography component="p" variant="h4">
				From Node 1
			</Typography>
			<Typography component="p" variant="h6" color="text.s]" sx={{ flex: 1, my: 3 }}>
				From {date}
			</Typography>
			<div>
				<Link color="primary" href="#" onClick={preventDefault}>
					View Message
				</Link>
			</div>
		</React.Fragment>
	);
}
