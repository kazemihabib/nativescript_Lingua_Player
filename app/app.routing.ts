import {playerPage} from "./pages/player/player.component";
import {firstPage} from "./pages/home/home.component"

export const routes = [
  { path: "", component: firstPage },
  { path: "player", component: playerPage }
];

export const navigatableComponents = [
    playerPage,
    firstPage
];
