import React, { useState, useEffect } from "react";
import "./Dropdown.css";

const Dropdown = ({ label, options, onSelect, displayOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [visibleOptions, setVisibleOptions] = useState([]);

  const toggleDropdown = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    setVisibleOptions([]);
    onSelect(option);
  };

  useEffect(() => {
    if (isOpen) {
      options.forEach((option, index) => {
        setTimeout(() => {
          setVisibleOptions((prev) => [...prev, option]);
        }, index * 100);
      });
    } else {
      setVisibleOptions([]);
    }
  }, [isOpen, options]);

  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        {selectedOption || label}
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {visibleOptions.map((option, index) => (
            <button key={index} onClick={() => handleOptionClick(option)}>
              {displayOption ? displayOption(option) : option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
