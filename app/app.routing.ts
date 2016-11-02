import {playerPage} from "./pages/player/player.component";
import {firstPage} from "./pages/first/first.component"

export const routes = [
  { path: "", component: firstPage },
  { path: "player", component: playerPage }
];

export const navigatableComponents = [
    playerPage,
    firstPage
];
