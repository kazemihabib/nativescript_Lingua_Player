import {playerPage} from "./pages/player/player.component";
import {HomeComponent} from "./pages/home/home.component"

export const routes = [
  { path: "", component: HomeComponent },
  { path: "player", component: playerPage }
];

export const navigatableComponents = [
    playerPage,
    HomeComponent
];
