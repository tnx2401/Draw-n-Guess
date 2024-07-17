import create from "zustand";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase"; // Your Firebase config file
import { v4 as uuidv4 } from "uuid";

const userStore = create((set) => ({
  uid: uuidv4(),
  currentCharacter: `https://garticphone.com/images/avatar/${Math.floor(
    Math.random() * 46
  )}.svg`,
  username: "",
  isSave: false,
  setCurrentCharacter: () =>
    set({
      currentCharacter: `https://garticphone.com/images/avatar/${Math.floor(
        Math.random() * 46
      )}.svg`,
    }),
  setUsername: (username) => set({ username }),
  setSaveStatus: (status) => set({ isSave: status }),
  saveUserInfo: async (currentCharacter, username, uid) => {
    const userDoc = doc(db, "users", uid);
    try {
      await setDoc(userDoc, {
        avatar: currentCharacter,
        username: username,
      });
    } catch (error) {
      console.error("Error saving user info: ", error);
    }
  },
  deleteUser: async (uid) => {
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  },
}));

export default userStore;
