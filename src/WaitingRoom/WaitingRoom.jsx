import "./WaitingRoom.css";

import roomStore from "../lib/roomStore";
import userStore from "../lib/userStore";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import CustomPrompt from "../CustomPrompt/CustomPrompt";
import Game from "../Game/Game";

function WaitingRoom({ BackToJoinRoom = () => {}, BackToCreate = () => {} }) {
  const {
    roomId,
    idToJoin,
    createdBy,
    gameTopic,
    gameTime,
    leaveRoom,
    deleteRoom,
  } = roomStore();
  const { uid, currentCharacter, username } = userStore();

  const [players, setPlayers] = useState([]);
  const [roomIsDeleted, setRoomIsDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startGame, setStartGame] = useState(false);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setRoomIsDeleted(true);
      setIsLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "rooms", roomId), (doc) => {
      if (doc.exists && doc.data()) {
        const roomData = doc.data();
        if (roomData) {
          setPlayers(roomData.players);
          setIsLoading(false);
          if (roomData.started) {
            setStartGame(true);
            setCurrentDrawer(roomData.currentDrawer);
          }
        }
      } else {
        setPlayers([]);
        setRoomIsDeleted(true);
        setIsLoading(false);
      }
    });

    const unsubStatus = onSnapshot(doc(db, "room_status", roomId), (doc) => {
      if (!doc.exists()) {
        setRoomIsDeleted(true);
        setIsLoading(false);
      } else {
        const statusData = doc.data();
        if (statusData.started) {
          setStartGame(true);
          setCurrentDrawer(statusData.currentDrawer);
        }
      }
    });

    return () => {
      unsub();
      unsubStatus();
    };
  }, [roomId]);

  useEffect(() => {
    if (roomIsDeleted) {
      BackToJoinRoom();
      setModalOpen(true);
      setRoomIsDeleted(true);
    }
  }, [roomIsDeleted, BackToJoinRoom]);

  const handleLeaveRoom = async () => {
    if (uid != createdBy) {
      const player = { uid, currentCharacter, username };
      await leaveRoom(roomId, player);
      BackToJoinRoom();
    } else {
      setModalOpen(true);
      setRoomIsDeleted(true);
      await deleteRoom(roomId);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const handleReturn = () => {
    BackToCreate();
    setModalOpen(false);
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      setModalOpen(true);
    } else {
      const roomStatusRef = doc(db, "room_status", roomId);
      const roomRef = doc(db, "rooms", roomId);
      const firstDrawer = players[0].uid;

      try {
        await updateDoc(roomStatusRef, {
          started: true,
          currentDrawer: firstDrawer,
        });

        await updateDoc(roomRef, {
          started: true,
          currentDrawer: firstDrawer,
        });
        setStartGame(true);
        setCurrentDrawer(firstDrawer);
      } catch (error) {
        console.error("Error updating document:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribeStatus = onSnapshot(
      doc(db, "room_status", roomId),
      (statusDoc) => {
        if (statusDoc.exists()) {
          const status = statusDoc.data();
          if (status.started) {
            setStartGame(true);
            setCurrentDrawer(status.currentDrawer);
          }
        }
      }
    );
    const unsubscribeRoom = onSnapshot(doc(db, "rooms", roomId), (roomDoc) => {
      if (roomDoc.exists()) {
        const room = roomDoc.data();
        if (room.started) {
          setStartGame(true);
          setCurrentDrawer(room.currentDrawer);
        }
      }
    });
    return () => {
      unsubscribeStatus();
      unsubscribeRoom();
    };
  }, [roomId]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {startGame ? (
        <Game
          currentDrawer={currentDrawer}
          BackToJoinRoom={BackToJoinRoom}
          BackToCreate={BackToCreate}
        />
      ) : roomIsDeleted ? (
        <CustomPrompt
          isOpen={isModalOpen}
          title="Thông báo"
          message="Phòng đã bị xóa"
          onCancel={handleReturn}
        />
      ) : (
        <>
          <CustomPrompt
            isOpen={isModalOpen}
            title="Thông báo"
            message="Cần ít nhất 2 người trở lên để bắt đầu trận đấu"
            onCancel={handleCancel}
          />
          <div className="waiting-room-container">
            <div className="id-container">
              <p>Mã phòng:</p>
              <h1>{idToJoin}</h1>
              <h3>Chủ đề: {gameTopic}</h3>
              <h4>Thời gian: {gameTime} phút</h4>
              <button onClick={handleLeaveRoom}>Rời phòng</button>
            </div>
            <div className="players-container">
              <h2>Danh sách người chơi ({players.length})</h2>
              <div className="players-temp-container">
                {players.map((player) => (
                  <div className="player" key={player.uid}>
                    <img src={player.currentCharacter} alt="" />
                    <div className="player-info">
                      <h3>{player.username}</h3>
                      <h5>{player.uid === createdBy ? "Chủ phòng" : ""}</h5>
                    </div>
                  </div>
                ))}
              </div>
              <div className="join-game-button-container">
                {uid === createdBy ? (
                  <button onClick={handleStartGame}>Bắt đầu trò chơi</button>
                ) : (
                  <button disabled>Chờ chủ phòng bắt đầu trò chơi</button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default WaitingRoom;
