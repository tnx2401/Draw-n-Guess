import create from "zustand";

const gameStore = create((set) => ({
  game_uid: "",
  game_username: "",
  game_point: 0,
  game_brushColor: "",
  game_displayWord: "",

  game_setUid: (uid) => set({ game_uid: uid }),
  game_setUsername: (username) => set({ game_username: username }),
  game_setPoint: (point) =>
    set((state) => ({ game_point: state.point + point })),
  game_setBrushColor: (brushColor) => set({ game_brushColor: brushColor }),
  game_setDisplayWord: (displayWord) => set({ game_displayWord: displayWord }),
}));

export default gameStore;
