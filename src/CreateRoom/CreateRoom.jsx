import userStore from "../lib/userStore";
import "./CreateRoom.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Dropdown from "./Dropdown.jsx";
import WaitingRoom from "../WaitingRoom/WaitingRoom.jsx";
import roomStore from "../lib/roomStore.js";

function CreateRoom({ BackToHome, BackToCreate }) {
  // * Zustand
  const { uid, currentCharacter, username } = userStore();
  const {
    roomId,
    gameTopic,
    gameTime,
    players,
    setRoomTopic,
    setRoomTime,
    setPlayers,
    setCreatedBy,
    createRoom,
  } = roomStore();

  // * Navigation
  const [isWaitingRoom, setIsWaitingRoom] = useState(false);
  const handleCreateRoom = async () => {
    const player = { uid, username, currentCharacter };
    await setPlayers(player);
    await setCreatedBy(uid);

    const updatedPlayers = [...players, player];

    await createRoom(roomId, gameTopic, gameTime, uid, updatedPlayers);
    setIsWaitingRoom(true);
  };

  const handleBackToCreate = () => {
    setIsWaitingRoom(false);
  };

  // * Game topic and time
  const topicOptions = ["Chung", "Động vật", "Đồ ăn", "Nhân vật trò chơi"];
  const timeOptions = [1, 2, 3];

  return (
    <>
      {isWaitingRoom ? (
        <WaitingRoom BackToCreate={handleBackToCreate}/>
      ) : (
        <div className="create-room-container">
          <div className="top">
            <div className="userinfo">
              <img src={currentCharacter} alt="" />
              <h1>{username}</h1>
            </div>
            <div className="title">
              <h1>Tạo phòng</h1>
            </div>
            <button onClick={BackToHome}>
              <FontAwesomeIcon icon={faRightToBracket} />
            </button>
          </div>
          <div className="middle">
            <Dropdown
              label="Chủ đề"
              options={topicOptions}
              onSelect={(option) => setRoomTopic(option)}
            />
            <Dropdown
              label="Thời gian chơi"
              options={timeOptions}
              onSelect={(option) => setRoomTime(option)}
              displayOption={(option) => `${option} Phút`}
            />
          </div>
          <div className="bottom">
            {gameTopic != "" && gameTime != 0 && (
              <button onClick={handleCreateRoom}>Tạo</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CreateRoom;
