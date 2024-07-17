import { create } from "zustand";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  query,
  onSnapshot,
  collection,
  where,
  getDocs,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import { v4 as uuidv4 } from "uuid";

const generateUniqueIdToJoin = async () => {
  let unique = false;
  let newIdToJoin;

  while (!unique) {
    newIdToJoin = Math.floor(Math.random() * 9000) + 1000;
    const q = query(
      collection(db, "rooms"),
      where("idToJoin", "==", newIdToJoin)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      unique = true;
    }
  }
  return newIdToJoin;
};

const roomStore = create((set) => ({
  roomId: uuidv4(),
  idToJoin: null,
  gameTopic: "",
  gameTime: 0,
  createdBy: "",
  players: [],
  setRoomTopic: (topic) => set({ gameTopic: topic }),
  setRoomTime: (time) => set({ gameTime: time }),
  setPlayers: (newPlayer) =>
    set((state) => ({ players: [...state.players, newPlayer] })),
  setCreatedBy: (uid) => set({ createdBy: uid }),
  createRoom: async (roomId, gameTopic, gameTime, createdBy, players) => {
    const idToJoin = await generateUniqueIdToJoin();
    const roomDoc = doc(db, "rooms", roomId);
    const statusDoc = doc(db, "room_status", roomId);
    try {
      await setDoc(roomDoc, {
        idToJoin: idToJoin,
        topic: gameTopic,
        time: gameTime,
        players: players,
        createdBy: createdBy,
        started: false,
        currentDrawer: null,
      });

      await setDoc(statusDoc, {
        exists: true,
        started: false,
        currentDrawer: null,
      });

      set({ roomId, idToJoin, gameTopic, gameTime, createdBy, players });
    } catch (error) {
      console.log("Error creating room: ", error);
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await deleteDoc(doc(db, "rooms", roomId));
      await deleteDoc(doc(db, "room_status", roomId));

      set({
        roomId: uuidv4(),
        idToJoin: null,
        gameTopic: "",
        gameTime: 0,
        createdBy: "",
        players: [],
      });
    } catch (error) {
      console.log("Error deleting room: ", error);
    }
  },

  findRoomByIdToJoin: async (idToJoin) => {
    const q = query(
      collection(db, "rooms"),
      where("idToJoin", "==", parseInt(idToJoin))
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, data: doc.data() };
    }
    return null;
  },

  joinRoom: async (idToJoin, player) => {
    const room = await roomStore.getState().findRoomByIdToJoin(idToJoin);
    if (room) {
      const roomDoc = doc(db, "rooms", room.id);
      await updateDoc(roomDoc, {
        players: arrayUnion(player),
      });
      set((state) => ({
        roomId: room.id,
        idToJoin: room.data.idToJoin,
        players: [...state.players, player],
        gameTopic: room.data.topic,
        gameTime: room.data.time,
        createdBy: room.data.createdBy,
      }));

      const unsubscribe = onSnapshot(roomDoc, (doc) => {
        if (doc.exists && doc.data()) {
          const updatedPlayers = doc.data().players;
          set((state) => ({
            players: updatedPlayers,
          }));
        } else {
          console.log("Room has been deleted");
          set((state) => ({
            roomId: uuidv4(),
            idToJoin: null,
            players: [],
            gameTopic: "",
            gameTime: 0,
            createdBy: "",
          }));
        }
      });

      return () => unsubscribe();
    } else {
      console.log("Error: Room doesnt exist ", idToJoin);
      return false;
    }
  },

  leaveRoom: async (roomId, player) => {
    const roomDoc = doc(db, "rooms", roomId);
    const docSnap = await getDoc(roomDoc);

    if (docSnap.exists()) {
      await updateDoc(roomDoc, {
        players: arrayRemove(player),
      });
      set((state) => ({
        players: state.players.filter((p) => p !== player),
      }));
      return true;
    } else {
      console.log("Error: Room doesn't exist", roomId);
      return false;
    }
  },
}));

export default roomStore;
