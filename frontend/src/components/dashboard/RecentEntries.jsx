import { Fragment, useEffect, useState } from "react";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Title from "./Title";
import { APIHandlerDashboard } from "../../services/rest/APIHandler/APIHandlerDashboard";
import Box from "@mui/material/Box";
import RecentReportsRequest from "../../services/rest/RequestORM/Dashboard/RecentReportsRequest";

export default function RecentEntries() {
  const [recentReports, setRecentReports] = useState(null);
  const columnHeaders = [
    "Date",
    "Coqui",
    "Wightmanae",
    "Gryllus",
    "Portoricensis",
    "Unicolor",
    "Hedricki",
    "Locustus",
    "Richmondi",
    "Humidity",
    "Temperature",
    "Pressure",
    "Raining",
  ];
  const [loading, setLoading] = useState(false);
  const [lowTemperature, setLowTemperatureRange] = useState([-100, 100]);
  const [lowPressureRange, setLowPressureRange] = useState(0);
  const [lowhumidityRange, setLowuHmidityRange] = useState(0);
  const [lowcommonCoquiRange, setLowCommmonCoquiRange] = useState(0);
  const [lowgryllusRange, setLowGryllusRange] = useState(0);
  const [lowWightmanaeRange, setLowWightmanaeRange] = useState(0);
  const [lowportoricensisRange, setLowPortoricensisRange] = useState(0);
  const [lowunicolorRange, setLowUnicolorRange] = useState(0);
  const [lowhedrickiRange, setLowHecrickiRange] = useState(0);
  const [lowlocustusRange, setLowLocustusRange] = useState(0);
  const [lowrichmondiRange, setLowRichmondiRange] = useState(0);
  const [lowdateRange, setLowDateRange] = useState(0);
  const [hightemperatureRange, setHighTemperatureRange] = useState(10000);
  const [highpressureRange, setHighPressureRange] = useState(100000);
  const [highhumidityRange, setHighHumidityRange] = useState(100000);
  const [highcommonCoquiRange, setHighCommmonCoquiRange] = useState(100000);
  const [highWightmanaeRange, setHighWightmanaeRange] = useState(10000);
  const [highgryllusRange, setHighGryllusRange] = useState(100000);
  const [highportoricensisRange, setHighPortoricensisRange] = useState(100000);
  const [highunicolorRange, setHighUnicolorRange] = useState(100000);
  const [highhedrickiRange, setHighHecrickiRange] = useState(100000);
  const [highlocustusRange, setHighLocustusRange] = useState(100000);
  const [highrichmondiRange, setHighRichmondiRange] = useState(100000);
  const [highdateRange, setHighDateRange] = useState(100000);
  const filters = useMemo(() => {

    const filters = {
        "low_temp" : lowTemperature,
        "high_temp" : hightemperatureRange,
        "low_humidity" : lowhumidityRange,
        "high_humidity" : highhumidityRange,
        "low_pressure" : lowPressureRange,
        "high_pressure" : highpressureRange,
        "low_coqui" : lowcommonCoquiRange,
        "high_coqui" : highcommonCoquiRange,
        "low_wightmanae" : lowWightmanaeRange,
        "high_wightmanae" : highWightmanaeRange,
        "low_gryllus" : lowgryllusRange,
        "high_gryllus" : highgryllusRange,
        "low_portoricensis" : lowportoricensisRange,
        "high_portoricensis" : highportoricensisRange,
        "low_unicolor" : lowunicolorRange, 
        "high_unicolor" : highunicolorRange,
        "low_hedricki" : lowhedrickiRange,
        "high_hedricki" : highhedrickiRange,
        "low_locustus" :  lowlocustusRange,
        "high_locustus" : highlocustusRange,
        "low_richmondi" : lowrichmondiRange,
        "high_richmondi" : highrichmondiRange,
        "description_filter" : "",
        "skip" : 0,
        "limit" : 10,
        "orderby" : 1 
    }

    return filters;
  }, [
    lowTemperature,
    hightemperatureRange,
    lowPressureRange,
    highpressureRange,
    lowhumidityRange,
    highhumidityRange,
    lowcommonCoquiRange,
    highcommonCoquiRange,
    lowgryllusRange,
    highgryllusRange,
    lowportoricensisRange,
    highportoricensisRange,
    lowunicolorRange, 
    highunicolorRange,
    lowhedrickiRange,
    highhedrickiRange,
    lowlocustusRange,
    highlocustusRange,
    lowrichmondiRange,
    highrichmondiRange,
    lowdateRange,
    highdateRange
  ]);
  const LIMIT = 10;

  useEffect(() => {
    const getRecentReports = async () => {
      const dashboardAPIHandler = new APIHandlerDashboard();
      let recentReportsRequest = new RecentReportsRequest(filters);
      setLoading(true);
      let recent_reports = await dashboardAPIHandler.get_recent_reports(recentReportsRequest);
      setLoading(false);
      console.log("Recent Reports Object: ", recent_reports);
      setRecentReports(recent_reports);
    };

    getRecentReports();
  }, []);

  // decision: search, filter, and order by are done in backend and refreshes the table
  //  low_temp: float = float("-inf"),
  //   high_temp: float = float("inf"),
  //   low_humidity: float = float("-inf"),
  //   high_humidity: float = float("inf"),
  //   low_pressure: float = float("-inf"),
  //   high_pressure: float = float("inf"),
  //   low_coqui: int = 0,
  //   high_coqui: int = 1 << 31 - 1,  # int max for PostgresSQL integer data type
  //   low_wightmanae: int = 0,
  //   high_wightmanae: int = 1 << 31 - 1,
  //   low_gryllus: int = 0,
  //   high_gryllus: int = 1 << 31 - 1,
  //   low_portoricensis: int = 0,
  //   high_portoricensis: int = 1 << 31 - 1,
  //   low_unicolor: int = 0,
  //   high_unicolor: int = 1 << 31 - 1,
  //   low_hedricki: int = 0,
  //   high_hedricki: int = 1 << 31 - 1,
  //   low_locustus: int = 0,
  //   high_locustus: int = 1 << 31 - 1,
  //   low_richmondi: int = 0,
  //   high_richmondi: int = 1 << 31 - 1,
  //   description_filter: str = "%",
  //   skip: int = 0,
  //   limit: int = 10,
  //   orderby: int = 1,  # This could be changed to an enum, but passing through the query might be weird.
  return (
    <div>
      <Title>Recent Database Entries</Title>
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              {columnHeaders.map((header) => (
                <TableCell key={header} align="center" sx={{ padding: "16px" }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {recentReports &&
              recentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell align="center">
                    {new Date(report.ttime).toUTCString()}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.coqui}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wightmanae}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.gryllus}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.portoricensis}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.unicolor}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.hedricki}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.locustus}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.richmondi}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wdhumidity}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wdtemperature}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wdpressure}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px" }}>
                    {report.wddid_rain ? "YES" : "NO"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
    </div>
  );
}
