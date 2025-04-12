import React from "react";
import { styled } from "@mui/material/styles";
import { Link as LinkRouter } from "react-router-dom";
import { Link as LinkScroll } from "react-scroll";
import { FaTimes } from "react-icons/fa";

export const SidebarContainer = styled("aside")(({ isOpen }) => ({
  position: "fixed",
  zIndex: 999,
  width: "100%",
  height: "100%",
  background: "#0d0d0d",
  display: "grid",
  alignItems: "center",
  top: isOpen ? "0" : "-100%",
  left: 0,
  transition: "0.3s ease-in-out",
  opacity: isOpen ? "100%" : "0",
}));

export const CloseIcon = styled(FaTimes)({
  color: "#ffc857",
});

export const Icon = styled("div")({
  position: "absolute",
  top: "1.2rem",
  right: "1.5rem",
  fontSize: "2rem",
  cursor: "pointer",
  outline: "none",
});

export const SidebarWrapper = styled("div")({
  color: "#fff",
});

export const SidebarMenu = styled("ul")(({ theme }) => ({
  display: "grid",
  padding: 0,
  gridTemplateColumns: "1fr",
  gridTemplateRows: "repeat(6, 80px)",
  textAlign: "center",
  [theme.breakpoints.down("xs")]: {
    gridTemplateRows: "repeat(6, 60px)",
  },
}));

export const SidebarLinkS = styled(LinkScroll)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  textDecoration: "none",
  listStyle: "none",
  transition: "0.2s ease-in-out",
  color: "#fff",
  cursor: "pointer",
  "&:hover": {
    color: "#ffc857",
    transition: "0.2s ease-in-out",
  },
});

export const SidebarLinkR = styled(LinkRouter)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  textDecoration: "none",
  listStyle: "none",
  transition: "0.2s ease-in-out",
  color: "#fff",
  cursor: "pointer",
  "&:hover": {
    color: "#ffc857",
    transition: "0.2s ease-in-out",
  },
});

export const SideBtnWrap = styled("div")({
  display: "flex",
  justifyContent: "center",
});

export const SidebarRoute = styled(LinkRouter)({
  borderRadius: "50px",
  background: "#ffc857",
  whiteSpace: "nowrap",
  padding: "16px 64px",
  color: "#010606",
  fontSize: "16px",
  outline: "none",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  textDecoration: "none",
  "&:hover": {
    background: "#fff",
    color: "#010606",
    transition: "all 0.2s ease-in-out",
  },
});

const Sidebar = ({ isOpen, toggle, isHome }) => {
  return (
    <SidebarContainer isOpen={isOpen} onClick={toggle}>
      <Icon onClick={toggle}>
        <CloseIcon />
      </Icon>
      {isHome ? (
        <SidebarWrapper>
          <SidebarMenu>
            <SidebarLinkS to="dashboard" onClick={toggle}>
              Dashboard
            </SidebarLinkS>
            <SidebarLinkS to="NetworkMonitor" onClick={toggle}>
              IoT Network
            </SidebarLinkS>
            <SidebarLinkS to="classifier" onClick={toggle}>
              Classifier
            </SidebarLinkS>
            <SidebarLinkS to="spectralanalysis" onClick={toggle}>
              Spectral Analysis
            </SidebarLinkS>
            <SidebarLinkR to="/About" onClick={toggle}>
              About
            </SidebarLinkR>
          </SidebarMenu>
        </SidebarWrapper>
      ) : (
        <SidebarWrapper>
          <SidebarMenu>
            <SidebarLinkR to="/Dashboard" onClick={toggle}>
              Dashboard
            </SidebarLinkR>
            <SidebarLinkR to="/NetworkMonitor" onClick={toggle}>
              IoT Network
            </SidebarLinkR>
            <SidebarLinkR to="/Classifier" onClick={toggle}>
              Classifier
            </SidebarLinkR>
            <SidebarLinkR to="/SpectralAnalysis" onClick={toggle}>
              Spectral Analysis
            </SidebarLinkR>
            <SidebarLinkR to="/About" onClick={toggle}>
              About
            </SidebarLinkR>
          </SidebarMenu>
        </SidebarWrapper>
      )}
    </SidebarContainer>
  );
};

export default Sidebar;
