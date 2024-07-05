import { ToolObject } from "@/app/_components/Tools";
import Color from "color";
import { atom, createStore } from "jotai";

const gridCellSizeAtom = atom(0);
const toolAtom = atom<ToolObject | null>(null);
const colorAtom = atom<Color>(new Color("#000000"));
const mouseXAtom = atom(0);
const mouseYAtom = atom(0);
const gridXAtom = atom(0);
const gridYAtom = atom(0);
const isUsingToolAtom = atom(false);
const store = createStore();

export {
  gridCellSizeAtom,
  toolAtom,
  colorAtom,
  mouseXAtom,
  mouseYAtom,
  gridXAtom,
  gridYAtom,
  isUsingToolAtom,
  store,
};