import { useEffect, useState } from "react";
import "./PostGame.css";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import userStore from "../lib/userStore";
import roomStore from "../lib/roomStore";
import Game from "../Game/Game";

function PostGame({
  currentDrawer,
  BackToJoinRoom = () => {},
  BackToCreate = () => {},
}) {
  const { roomId, createdBy, leaveRoom, deleteRoom } = roomStore();
  const { uid, currentCharacter, username } = userStore();

  const [gameScore, setGameScore] = useState({ playersScore: [] });
  const [players, setPlayers] = useState([]);
  const [startGame, setStartGame] = useState(false);
  const [nextDrawer, setNextDrawer] = useState("");

  useEffect(() => {
    const fetchScores = async () => {
      const scoreRef = doc(db, "guesses", roomId);
      const scoreSnap = await getDoc(scoreRef);

      if (scoreSnap.exists()) {
        const fetchedScores = scoreSnap.data();
        fetchedScores.playersScore.sort((a, b) => b.score - a.score);
        setGameScore(fetchedScores);
      }
    };

    const fetchPlayers = async () => {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const fetchedPlayerInfo = roomSnap.data().players;
        setPlayers(fetchedPlayerInfo);
      }
    };

    fetchScores();
    fetchPlayers();
  }, [roomId]);

  const handleLeaveRoom = async () => {
    try {
      if (uid !== createdBy) {
        const player = { uid, currentCharacter, username };
        await leaveRoom(roomId, player);
        BackToJoinRoom();
      } else {
        await deleteRoom(roomId);
        BackToCreate();
      }
    } catch (error) {
      console.log("Error", error);
    }
  };

  const handleRestartGame = async () => {
    console.log("Restarting game");
    const roomStatusRef = doc(db, "room_status", roomId);
    const roomRef = doc(db, "rooms", roomId);
    const guesseRef = doc(db, "guesses", roomId);

    try {
      if (!currentDrawer) {
        console.error("currentDrawer is undefined");
        return;
      }

      const currentIndex = players.findIndex(
        (player) => player.uid === currentDrawer
      );

      if (currentIndex === -1) {
        console.error("Current drawer not found in players array");
        return;
      }

      const nextIndex = (currentIndex + 1) % players.length;
      const nextDrawer = players[nextIndex].uid;

      await Promise.all([
        updateDoc(roomStatusRef, {
          started: true,
          currentDrawer: nextDrawer,
        }),
        updateDoc(roomRef, {
          started: true,
          currentDrawer: nextDrawer,
        }),
        updateDoc(guesseRef, {
          correctGuesser: [],
          playersScore: [],
        }),
      ]);

      setStartGame(false);
      setNextDrawer("");
      setTimeout(() => {
        setStartGame(true);
        setNextDrawer(nextDrawer);
      }, 0); // Delay to ensure state reset
    } catch (error) {
      console.log("Error", error);
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
            setNextDrawer(status.currentDrawer);
          }
        }
      }
    );
    const unsubscribeRoom = onSnapshot(doc(db, "rooms", roomId), (roomDoc) => {
      if (roomDoc.exists()) {
        const room = roomDoc.data();
        if (room.started) {
          setStartGame(true);
          setNextDrawer(room.currentDrawer);
        }
      }
    });
    return () => {
      unsubscribeStatus();
      unsubscribeRoom();
    };
  }, [roomId]);

  if (startGame) {
    return <Game currentDrawer={nextDrawer} />;
  }

  return (
    <div className="leaderboard">
      <div className="top-leaderboard">
        <h1>Bảng xếp hạng</h1>
      </div>
      <div className="main-leaderboard">
        {gameScore.playersScore.map((playerScore, index) => (
          <div key={playerScore.uid} className="player-score">
            <span className="rank">{index + 1}</span>
            <img src={playerScore.currentCharacter} alt="" />
            <h1>{playerScore.username}</h1>
            <h3>{playerScore.score}</h3>
          </div>
        ))}
      </div>
      <div className="bottom-leaderboard">
        <button onClick={handleRestartGame} disabled={uid !== createdBy}>
          {uid !== createdBy
            ? "Chờ chủ phòng bắt đầu lại trờ chơi"
            : "Chơi lại"}
        </button>
        <button onClick={handleLeaveRoom}>Rời phòng</button>
      </div>
    </div>
  );
}

export default PostGame;
