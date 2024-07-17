import roomStore from "../lib/roomStore";
import userStore from "../lib/userStore";
import WaitingRoom from "../WaitingRoom/WaitingRoom";
import "./JoinRoom.css";

import { useState } from "react";
function JoinRoom({ BackToHome }) {
  const [roomId, setRoomId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const { joinRoom } = roomStore();
  const { uid, username, currentCharacter } = userStore();

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setRoomId(value);
    }
  };

  const handleJoinRoom = async () => {
    if (roomId.trim() !== "") {
      const player = {
        uid,
        currentCharacter,
        username,
      };
      const success = await joinRoom(parseInt(roomId), player);
      if (success) {
        setIsJoined(true);
      } else {
        alert("Room doesnt exist");
      }
    }
  };

  const handleBackToJoinRoom = () => {
    setIsJoined(false);
    setRoomId("");
  };
  return (
    <>
      {isJoined ? (
        <WaitingRoom BackToJoinRoom={handleBackToJoinRoom} />
      ) : (
        <div className="join-room-container">
          <h2>Nhập ID phòng:</h2>
          <input
            type="text"
            value={roomId}
            onChange={handleInputChange}
            pattern="\d*"
            inputMode="numeric"
          />
          <div className="join-room-buttons">
            <button onClick={handleJoinRoom}>Vào Phòng</button>
            <button onClick={BackToHome}>Trở lại</button>
          </div>
        </div>
      )}
    </>
  );
}

export default JoinRoom;
