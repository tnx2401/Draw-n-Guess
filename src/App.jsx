import "./App.css";
import "animate.css";
import React from "react";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";

import CreateRoom from "./CreateRoom/CreateRoom";
import JoinRoom from "./JoinRoom/JoinRoom";
import Instruction from "./Instructions/Instructions";

import userStore from "./lib/userStore";

function App() {
  // ! For navigation
  const [view, setView] = useState("home");

  const [shake, setShake] = useState(false);

  // ! Zustand
  const {
    uid,
    currentCharacter,
    username,
    isSave,
    setSaveStatus,
    setCurrentCharacter,
    setUsername,
    saveUserInfo,
    deleteUser,
  } = userStore();

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      deleteUser(uid);
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uid, deleteUser]);

  useEffect(() => {
    const usernameInput = document.getElementById("username");
    const changeAvatarButton = document.getElementById("change-avatar");

    if (isSave) {
      usernameInput.disabled = true;
      changeAvatarButton.disabled = true;
    } else {
      usernameInput.disabled = false;
      changeAvatarButton.disabled = false;
    }
  }, [isSave]);

  const handleSaveInfo = async () => {

    if(username.trim() === "") {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (isSave) {
      setSaveStatus(false);
    } else {
      await saveUserInfo(currentCharacter, username, uid);
      setSaveStatus(true);
    }
  };

  const handleOnClick = () => {
    setCurrentCharacter(
      `https://garticphone.com/images/avatar/${Math.floor(
        Math.random() * 46
      )}.svg`
    );
  };

  const handleUsername = (e) => {
    setUsername(e.target.value);
  };

  const handleBackToHome = () => {
    deleteUser(uid);
    setSaveStatus(false);
    setView("home");
  };

  const handleBackToCreate = () => {
    setView("create-room")
  }

  const renderView = () => {
    switch (view) {
      case "create-room":
        return <CreateRoom BackToHome={handleBackToHome} BackToCreate={handleBackToCreate}/>;
      case "join-room":
        return <JoinRoom BackToHome={handleBackToHome}/>;
      case "instruction":
        return <Instruction />;
      default:
        return (
          <div className="main-page">
            <div className="left-main-page">
              <div className="user-info">
                <img src={currentCharacter} alt="" className="avatar" />
                <button id="change-avatar" onClick={handleOnClick}>
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>
                <div>
                  <h2>Chọn một nhân vật và biệt danh</h2>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="off"
                    onChange={handleUsername}
                    className={shake ? "shake" : ""}
                  />
                </div>
              </div>
              <button onClick={handleSaveInfo}>{isSave ? "Hủy" : "Lưu"}</button>
            </div>
            <div className="right-main-page">
              <button onClick={() => setView("create-room")} id="create-room" disabled={!isSave}>
                Tạo phòng
              </button>
              <button onClick={() => setView("join-room")} id="join-room" disabled={!isSave}>
                Vào phòng
              </button>
              <button onClick={() => setView("instruction")}>Cách chơi</button>
            </div>
          </div>
        );
    }
  };

  return renderView();
}

export default App;
