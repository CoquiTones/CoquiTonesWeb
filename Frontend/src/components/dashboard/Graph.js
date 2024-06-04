import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { LineChart, axisClasses } from '@mui/x-charts';

import Title from './Title';

// Generate Sales Data
function createData(time, amount) {
	return { time, amount: amount ?? null };
}

const data = [
	createData('January 5th', 0),
	createData('January 10th', 25),
	createData('January 20th', 35),
	createData('January 25th', 40),
	createData('February 5th', 40),
	createData('February 15th', 60),
	createData('February 20th', 78),
	createData('Febrary 25th', 55),
	createData('March 1st', 1),
];

export default function Chart() {
	const theme = useTheme();

	return (
		<React.Fragment>
			<Title>Detected Species vs Time </Title>
			<div style={{ width: '100%', flexGrow: 1, overflow: 'hidden' }}>
				<LineChart
					dataset={data}
					margin={{
						top: 16,
						right: 20,
						left: 70,
						bottom: 50,
					}}
					xAxis={[
						{
							label: 'Time',
							scaleType: 'point',
							dataKey: 'time',
							tickNumber: 2,
							tickLabelStyle: theme.typography.body2,
						},
					]}
					yAxis={[
						{
							label: 'Detected Species',
							labelStyle: {
								...theme.typography.body1,
								fill: theme.palette.text.primary,
							},
							tickLabelStyle: theme.typography.body2,
							max: 80,
							tickNumber: 3,
						},
					]}
					series={[
						{
							dataKey: 'amount',
							showMark: false,
							color: theme.palette.primary.light,
						},
					]}
					sx={{
						[`.${axisClasses.root} line`]: { stroke: theme.palette.text.secondary },
						[`.${axisClasses.root} text`]: { fill: theme.palette.text.secondary },
						[`& .${axisClasses.left} .${axisClasses.label}`]: {
							transform: 'translateX(-25px)',
						},
					}}
				/>
			</div>
		</React.Fragment>
	);
}
