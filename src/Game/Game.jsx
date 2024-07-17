import "./Game.css";
import { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import roomStore from "../lib/roomStore";
import userStore from "../lib/userStore";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../lib/firebase";

import seedrandom from "seedrandom";
import PostGame from "../PostGame/PostGame";

function Game({ currentDrawer, BackToJoinRoom, BackToCreate }) {
  const { roomId, gameTopic, gameTime } = roomStore();
  const { uid, username, currentCharacter } = userStore();

  const [players, setPlayers] = useState([]);

  const [guesses, setGuesses] = useState([]);
  const [guessInput, setGuessInput] = useState("");
  const [scores, setScores] = useState({});

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("");

  const [words, setWords] = useState([]);
  const [appearedWords, setAppearedWords] = useState([]);
  const [topic, setTopic] = useState("");
  const [displayedWord, setDisplayedWord] = useState("");
  const [actualWord, setActualWord] = useState("");

  const [timeLeft, setTimeLeft] = useState(gameTime * 60);

  const [isEndGame, setIsEndGame] = useState(false);

  //!Fetch players length
  useEffect(() => {
    const fetchPlayers = async () => {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const data = roomSnap.data();
        setPlayers(data.players);
      }
    };
    fetchPlayers();
  }, [roomId]);
  //!

  const handleTopic = (topicName) => {
    switch (topicName) {
      case "Chung":
        setTopic("general");
        break;
      case "Động vật":
        setTopic("animal");
        break;
      case "Đồ ăn":
        setTopic("food");
        break;
      case "Nhân vật trò chơi":
        setTopic("game_characters");
        break;
      default:
        setTopic("");
    }
  };

  useEffect(() => {
    handleTopic(gameTopic);
    const fetchWords = async () => {
      const wordRef = doc(db, "topic", topic);
      const wordSnap = await getDoc(wordRef);

      if (wordSnap.exists()) {
        const fetchedWords = wordSnap.data().words;
        setWords(fetchedWords);

        const randomWord =
          fetchedWords[Math.floor(Math.random() * fetchedWords.length)];

        setAppearedWords((prev) => [...prev, randomWord]);

        const displayedWord = randomWord
          .split("")
          .map((char) => (char === " " ? " " : "_"))
          .join("");

        await setDoc(
          doc(db, "rooms", roomId),
          {
            actualWord: randomWord,
            displayedWord: displayedWord,
          },
          { merge: true }
        );
      } else {
        setWords([]);
      }
    };
    fetchWords();
  }, [gameTopic, topic]);

  useEffect(() => {
    const wordDocRef = onSnapshot(doc(db, "rooms", roomId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setActualWord(data.actualWord || "");
        setDisplayedWord(data.displayedWord || "");
      }
    });
    return () => wordDocRef();
  }, [roomId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  useEffect(() => {
    const updateGameStatus = async () => {
      const gameStatusRef = doc(db, "room_status", roomId);
      const gameRoomRef = doc(db, "rooms", roomId);

      await updateDoc(gameStatusRef, {
        started: false,
        currentDrawer: null,
      });
      await updateDoc(gameRoomRef, {
        started: false,
        currentDrawer: null,
      });
      setIsEndGame(true);
      resetGameState();
    };

    const handleCountDown = () => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          updateGameStatus();
          return 0;
        }
        return prevTime - 1;
      });
    };

    const interval = setInterval(handleCountDown, 500);

    return () => clearInterval(interval);
  }, [roomId]);

  const seed = roomId;
  const rng = seedrandom(seed);

  useEffect(() => {
    const revealInterval = setInterval(() => {
      setDisplayedWord((prevDisplayedWord) => {
        const unrevealedIndices = [];

        for (let i = 0; i < actualWord.length; i++) {
          if (prevDisplayedWord[i] === "_") {
            unrevealedIndices.push(i);
          }
        }

        if (unrevealedIndices.length > 0) {
          const revealIndex =
            unrevealedIndices[Math.floor(rng() * unrevealedIndices.length)];
          const newDisplayedWord = prevDisplayedWord.split("");
          newDisplayedWord[revealIndex] = actualWord[revealIndex];
          return newDisplayedWord.join("");
        }

        clearInterval(revealInterval);
        return prevDisplayedWord;
      });
    }, 5000);

    return () => clearInterval(revealInterval);
  }, [actualWord]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.72;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    const context = canvas.getContext("2d");
    context.scale(1, 1);
    context.lineCap = "round";
    context.strokeStyle = brushColor;
    context.lineWidth = 10;
    contextRef.current = context;

    const initializeDrawingDocument = async () => {
      const drawingDocRef = doc(db, "drawings", roomId);
      const drawingDocSnap = await getDoc(drawingDocRef);

      if (!drawingDocSnap.exists()) {
        try {
          await setDoc(drawingDocRef, {
            drawingData: {},
            timestamp: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error initializing drawing document:", error);
        }
      }
    };

    initializeDrawingDocument();

    const unsub = onSnapshot(doc(db, "drawings", roomId), (doc) => {
      if (doc.exists()) {
        const drawingData = doc.data().drawingData;
        updateCanvas(drawingData);
      }
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = brushColor;
    }
  }, [roomId, brushColor]);

  const startDrawing = ({ nativeEvent }) => {
    if (uid !== currentDrawer) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = async () => {
    if (uid !== currentDrawer) return;
    setIsDrawing(false);
    await saveDrawing({ type: "endPath" });
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || uid !== currentDrawer) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    const drawingData = {
      type: "draw",
      offsetX,
      offsetY,
      lineWidth: contextRef.current.lineWidth,
      strokeStyle: contextRef.current.strokeStyle,
    };
    saveDrawing(drawingData);
  };

  const updateCanvas = (drawingData) => {
    if (!contextRef.current) return;

    if (drawingData) {
      if (drawingData.type === "draw") {
        contextRef.current.lineTo(drawingData.offsetX, drawingData.offsetY);
        contextRef.current.stroke();
      } else if (drawingData.type === "clear") {
        contextRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        contextRef.current.beginPath();
      } else if (drawingData.type === "endPath") {
        contextRef.current.beginPath();
      }
    }
  };

  const saveDrawing = async (drawingData = {}) => {
    const drawingDocRef = doc(db, "drawings", roomId);
    try {
      const drawingDocSnap = await getDoc(drawingDocRef);

      if (drawingDocSnap.exists()) {
        await updateDoc(drawingDocRef, {
          drawingData: drawingData,
          timestamp: serverTimestamp(),
        });
      } else {
        await setDoc(drawingDocRef, {
          drawingData: drawingData,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
    }
  };

  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const drawingData = {
      type: "clear",
    };
    await saveDrawing(drawingData);
  };

  const handleGuessInput = (e) => {
    setGuessInput(e.target.value);
  };

  // ! Handle submit guess (START)
  const handleGuessSubmit = async (e) => {
    e.preventDefault();
    if (guessInput.trim() === "") return;

    const guessDocRef = doc(db, "guesses", roomId);

    const newGuess = {
      uid,
      username,
      currentCharacter,
      guess: guessInput,
      correct: guessInput.toLowerCase() === actualWord.toLowerCase(),
    };

    try {
      const docSnap = await getDoc(guessDocRef);

      if (docSnap.exists()) {
        await updateDoc(guessDocRef, {
          guesses: arrayUnion(newGuess),
        });
      } else {
        await setDoc(guessDocRef, {
          guesses: [newGuess],
          correctGuesser: [],
        });
      }

      if (newGuess.correct) {
        await updateDoc(guessDocRef, {
          correctGuesser: arrayUnion(uid),
        });

        const updatedDocSnap = await getDoc(guessDocRef);
        const updatedCorrectGuesser =
          updatedDocSnap.data().correctGuesser || [];

        const points =
          Math.floor(timeLeft / 10) * (5 - updatedCorrectGuesser.length);

        setScores((prevScores) => ({
          ...prevScores,
          [uid]: (prevScores[uid] || 0) + points,
        }));

        const updatedScores = {
          ...scores,
          [uid]: (scores?.[uid] || 0) + points,
        };

        const existingScores = updatedDocSnap.data().playersScore || [];

        const mergedScores = existingScores.map((player) => {
          if (player.uid === uid) {
            return {
              ...player,
              username: username,
              score: player.score + points,
              currentCharacter: currentCharacter,
            };
          }
          return player;
        });

        if (!existingScores.some((player) => player.uid === uid)) {
          mergedScores.push({ uid, username, currentCharacter, score: points });
        }

        await updateDoc(guessDocRef, {
          playersScore: mergedScores,
        });

        console.log("Correct guesser length: ", updatedCorrectGuesser.length);
        console.log("Players: ", players.length - 1);
        if (updatedCorrectGuesser.length === players.length - 1) {
          await clearCanvas();
          await generateNewWord(actualWord);
          await updateDoc(guessDocRef, {
            correctGuesser: [],
          });
        }
      }
    } catch (error) {
      console.error("Error submitting guess: ", error);
    }

    setGuessInput("");
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "guesses", roomId), (guessDoc) => {
      if (guessDoc.exists()) {
        const data = guessDoc.data();
        setGuesses(Array.isArray(data.guesses) ? data.guesses : []);
      } else {
        setGuesses([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // ! Generate new word after all player have guessed correctly (START)
  const generateNewWord = async (currentWord) => {
    let newWord = currentWord;
    while (
      !newWord ||
      newWord === currentWord ||
      appearedWords.includes(newWord)
    ) {
      newWord = words[Math.floor(Math.random() * words.length)];
    }

    try {
      const displayedWord = newWord
        .split("")
        .map((char) => (char === " " ? " " : "_"))
        .join("");

      setAppearedWords((prev) => [...prev, newWord]);

      const roomDocRef = doc(db, "rooms", roomId);
      const roomDocSnap = await getDoc(roomDocRef);

      if (roomDocSnap.exists()) {
        await updateDoc(roomDocRef, {
          actualWord: newWord,
          displayedWord: displayedWord,
        });
      } else {
        console.error("Room document does not exist");
      }
    } catch (error) {
      console.log("Error generating new word: ", error);
    }
  };
  // ! Generate new word after all player have guessed correctly (END)

  // ! Change brush color (START)
  useEffect(() => {
    const roomDocRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBrushColor(data.brushColor); // Update brush color from Firestore
      }
    });

    return unsubscribe;
  }, [roomId]);

  const handleBrushColorChange = async (color) => {
    setBrushColor(color);
    const roomDocRef = doc(db, "rooms", roomId);

    try {
      await updateDoc(roomDocRef, {
        brushColor: color,
      });
    } catch (error) {
      console.error("Error updating brush color: ", error);
    }
  };
  // ! Change brush color (END)

  const colors = [
    "black",
    "red",
    "brown",
    "orange",
    "yellow",
    "green",
    "lightskyblue",
    "blue",
    "purple",
    "pink",
  ];

  if (isEndGame) {
    return (
      <PostGame
        currentDrawer={currentDrawer}
        BackToJoinRoom={BackToJoinRoom}
        BackToCreate={BackToCreate}
      />
    );
  }

  const resetGameState = () => {
    setActualWord("");
    setDisplayedWord("");
    setTimeLeft(gameTime * 60);
    setAppearedWords([]);
    setScores({});
    clearCanvas();
  };

  return (
    <div className="game-container">
      <div className="top-container">
        <p className="prevent-select">{formatTime(timeLeft)}</p>
        <p className="prevent-select">
          {uid == currentDrawer ? actualWord : displayedWord}
        </p>
      </div>
      <div className="bottom-container">
        <div className="drawing-container">
          <div className="canvas">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              onMouseLeave={finishDrawing}
            />
          </div>

          <div className="drawing-functions">
            <div className="pen-board-functions">
              <button onClick={clearCanvas} disabled={uid !== currentDrawer}>
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
            <div className="colors">
              {colors.map((color) => (
                <button
                  key={color}
                  id={color}
                  style={{ backgroundColor: color }}
                  onClick={() => handleBrushColorChange(color)}
                  disabled={uid !== currentDrawer}
                ></button>
              ))}
            </div>
          </div>
        </div>
        <div className="guess-container">
          <div className="player-guess-container">
            <ul>
              {guesses.map((guess, index) => (
                <li
                  key={index}
                  className={`prevent-select ${guess.correct ? "correct" : ""}`}
                >
                  {uid !== guess.uid
                    ? guess.correct
                      ? `${guess.username} has guessed correctly`
                      : `${guess.username} : ${guess.guess}`
                    : `${guess.username} : ${guess.guess}`}
                </li>
              ))}
            </ul>
          </div>
          <div className="guess-input-container">
            <form onSubmit={handleGuessSubmit}>
              <input
                type="text"
                placeholder="Type in your guess here"
                value={guessInput}
                onChange={handleGuessInput}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
