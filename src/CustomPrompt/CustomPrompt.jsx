import React from "react";
import "./CustomPrompt.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { useState, useEffect } from "react";

function Modal({ isOpen, title, message, onCancel }) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal ${shake ? "shake" : ""}`}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onCancel}>
            <FontAwesomeIcon icon={faCheck} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
