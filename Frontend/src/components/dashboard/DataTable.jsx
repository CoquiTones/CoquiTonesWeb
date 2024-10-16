import React, { useMemo, useRef } from "react";
import MUIDataTable from "mui-datatables";
import DataHandler from "../../services/DataHandler";
export default function DataTable() {


  const dataTableRef = useRef(null);



  /**
   * 
   * helper func to fetch recent entries based on current filtered date range
   */
  const fetchEntries = async () => {
    const dh = new DataHandler('node');
    const testNow = new Date().getTime() / 1000;
    return dh.fetchRecentEntries(0, testNow);
  }
  const data = useMemo(fetchEntries, []);
  const columns = useMemo(() => {
    const columns = [
      {
        name: "ttime",
        label: "TimeStamp",
        options: {
          filter: true,
          sort: true,
        }
      },
      {
        name: "nid",
        label: "Node ID",
        options: {
          filter: true,
          sort: true,
        }
      },
      {
        name: "ndescription",
        label: "Description",
        options: {
          filter: true,
          sort: false,
        }
      },
      {
        name: "wdtemperature",
        label: "Temperature (F)",
        options: {
          filter: true,
          sort: true,
        }
      },
      {
        name: "wdhumidity",
        label: "Humidity (RH%)",
        options: {
          filter: true,
          sort: true,
        }
      },
      {
        name: "wdpressure",
        label: "Pressure (hPa)",
        options: {
          filter: true,
          sort: true,
        }
      },
      {
        name: "wddid_rain",
        label: "Rain State",
        options: {
          filter: true,
          sort: false,
        }
      },
    ];
    return columns;
  }, [])

  const options = {
    filterType: 'checkbox',
    onFilterChange: (column, filterList, type) => {
      console.log("FILTER CHANGE TRIGGERED");
      console.log("Column val: ", column);
      console.log("filterList val: ", filterList);
      console.log("type val: ", type);
    }
  };

  return (

    <MUIDataTable
      title={"Employee List"}
      data={data}
      columns={columns}
      options={options}
      ref={dataTableRef}
    />
  )
}