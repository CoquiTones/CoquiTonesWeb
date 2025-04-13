import React from "react";
import "./HeroStyle.css";
import ClassifierBg from "../assets/images/ClassifierBackground.png";

const HeroSectionClassifier = () => {
  return (
    <div className="hero-container">
      <div className="hero-bg">
        <img
          src={ClassifierBg}
          alt="Machine Learning Analysis Background"
          className="image-bg"
        />
      </div>
      <div className="hero-content">
        <h1 className="hero-h1">Machine Learning Analysis</h1>
        <p className="hero-p">
          For machine learning information, scroll below!
        </p>
      </div>
    </div>
  );
};

export default HeroSectionClassifier;
