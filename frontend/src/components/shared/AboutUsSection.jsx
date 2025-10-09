import React from "react";
import { styled } from "@mui/material/styles";
import DiegoPFP from "../assets/images/DiegoProfessionalPFP.jpg";
import EdwinPFP from "../assets/images/EdwinCamuyPFP.png";
import RolandoPFP from "../assets/images/RolandoProfessionalPFP.jpg";

export const AboutUsContainer = styled("div")(({ theme }) => ({
  height: "800px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  marginTop: "-80px",
  background: "#191716",
  [theme.breakpoints.down("md")]: {
    height: "1100px",
  },
  [theme.breakpoints.down("sm")]: {
    height: "1300px",
    marginTop: "0px",
  },
}));

export const AboutUsWrapper = styled("div")(({ theme }) => ({
  maxWidth: "2000px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  alignItems: "center",
  gridGap: "16px",
  padding: "0 50px",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr 1fr",
  },
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    padding: "0 20px",
  },
}));

export const AboutUsCard = styled("div")({
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  borderRadius: "10px",
  maxHeight: "340px",
  padding: "30px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  transition: "all 0.2s ease-in-out",
  "&hover": {
    transform: "scale(1.02)",
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
  },
});

export const AboutUsPFP = styled("img")({
  height: "200px",
  width: "200px",
  marginBottom: "10px",
  borderRadius: "50%",
});

export const AboutUsH1 = styled("h1")(({ theme }) => ({
  fontSize: "2.5rem",
  color: "#ffc857",
  marginBottom: "64px",

  [theme.breakpoints.down("sm")]: {
    fontSize: "2rem",
  },
}));

export const AboutUsH2 = styled("h2")({
  fontSize: "1.75rem",
  color: "#a44200",
  marginBottom: "10px",
});

export const AboutUsP = styled("p")({
  fontSize: "1.25rem",
  textAlign: "center",
});

const AboutUsSection = () => {
  return (
    <AboutUsContainer>
      <AboutUsH1>About Us</AboutUsH1>
      <AboutUsWrapper>
        <AboutUsCard>
          <AboutUsPFP src={DiegoPFP} />
          <AboutUsH2>Diego A. Santiago Uriarte</AboutUsH2>
          <AboutUsP>
            {" "}
            Full-Stack Software Engineer. Role: A little bit of everything.
            Interested in hiking and swimming in local rivers of Puerto Rico
          </AboutUsP>
        </AboutUsCard>
        <AboutUsCard>
          <AboutUsPFP src={EdwinPFP} />
          <AboutUsH2>Edwin J. Camuy Medina</AboutUsH2>
          <AboutUsP>
            Software Engineer Graduate. Role: Backend Development and AI.
            Interested in creating new unorthodox things
          </AboutUsP>
        </AboutUsCard>
        <AboutUsCard>
          <AboutUsPFP src={RolandoPFP} />
          <AboutUsH2>Rolando Ríos Bonilla</AboutUsH2>
          <AboutUsP>
            Computer Science & Engineering Graduate. Role: Front-End
            Development. Interested in anything sports-related and music
          </AboutUsP>
        </AboutUsCard>
      </AboutUsWrapper>
    </AboutUsContainer>
  );
};

export default AboutUsSection;
