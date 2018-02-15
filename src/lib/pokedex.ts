import Pokedex from "pokedex-promise-v2";
import nconf from "./config";

const pokedex = new Pokedex(nconf.get("pokeapi"));
export default pokedex;
