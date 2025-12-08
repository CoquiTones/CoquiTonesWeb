import React from "react";
import { animateScroll as scroll } from "react-scroll";
import { FaGithub } from "react-icons/fa";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";

export const FooterContainer = styled("footer")({
  backgroundColor: "#191716",
});

export const FooterWrap = styled(Box)(({ theme }) => ({
  padding: "48px 24px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  maxWidth: 1100,
  margin: "0 auto",
}));

export const FooterLinksContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  [theme.breakpoints.down("md")]: {
    paddingTop: "32px",
  },
}));

export const FooterLinksWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export const FooterLinkItems = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  margin: "16px",
  textAlign: "left",
  width: "160px",
  boxSizing: "border-box",
  color: "#fff",
  [theme.breakpoints.down("xs")]: {
    margin: "0",
    padding: "10px",
    width: "100%",
  },
}));

export const FooterLinkTitle = styled("h1")(({ theme }) => ({
  fontSize: "14px",
  marginBottom: "16px",
}));

export const FooterLink = styled(Link)(({ theme }) => ({
  color: "#fff",
  textDecoration: "none",
  marginBottom: "0.5rem",
  fontSize: "14px",
  "&:hover": {
    color: "#ffc857",
    transition: "0.3s ease-out",
  },
}));

export const SocialMedia = styled("section")({
  maxWidth: 1000,
  width: "100%",
});

export const SocialMediaWrap = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: 1100,
  margin: "40px auto 0 auto",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export const SocialLogo = styled(Link)(({ theme }) => ({
  color: "#ffc857",
  justifySelf: "start",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  marginBottom: "16px",
  fontWeight: "bold",
}));

export const WebsiteRights = styled("small")(({ theme }) => ({
  color: "#fff",
  marginBottom: "16px",
}));

export const SocialIcons = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "160px",
});

export const SocialIconLink = styled("a")({
  color: "#fff",
  fontSize: "24px",
});

const Footer = () => {
  const toggleHome = () => {
    scroll.scrollToTop();
  };
  return (
    <FooterContainer>
      <FooterWrap>
        <SocialMedia>
          <SocialMediaWrap>
            <SocialLogo to="/" onClick={toggleHome}>
              CoquiTones
            </SocialLogo>
            <WebsiteRights>
              CoquiTones © {new Date().getFullYear()} All rights reserved
            </WebsiteRights>
            <SocialIcons>
              <SocialIconLink href="https://github.com/CoquiTones/CoquiTonesWeb">
                <FaGithub />
              </SocialIconLink>
            </SocialIcons>
          </SocialMediaWrap>
        </SocialMedia>
      </FooterWrap>
    </FooterContainer>
  );
};

export default Footer;
