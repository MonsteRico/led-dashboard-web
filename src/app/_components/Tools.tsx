import { Button } from "@/components/ui/button";
import {
  colorAtom,
  gridCellSizeAtom,
  gridXAtom,
  gridYAtom,
  store,
  toolAtom,
} from "@/lib/atoms";
import { cn } from "@/lib/utils";
import Color from "color";
import { useAtomValue } from "jotai";
import { EraserIcon, LucidePencil, Pipette } from "lucide-react";
import React from "react";

export interface ToolObject {
  name: string;
  render: ({
    setTool,
  }: {
    setTool: (tool: ToolObject) => void;
  }) => React.JSX.Element;
  use: (ctx: CanvasRenderingContext2D) => void;
}

const draw = (ctx: CanvasRenderingContext2D) => {
  console.log("draw");
  const gridX = store.get(gridXAtom);
  console.log(gridX);
  const gridY = store.get(gridYAtom);
  const gridCellSize = store.get(gridCellSizeAtom);
  const color = store.get(colorAtom);
  // Calculate the top-left corner of the grid cell
  const cellTopLeftX = gridX * gridCellSize;
  const cellTopLeftY = gridY * gridCellSize;

  ctx.fillStyle = color.hex();
  ctx.fillRect(cellTopLeftX, cellTopLeftY, gridCellSize, gridCellSize);
};

function PencilButton({ setTool }: { setTool: (tool: ToolObject) => void }) {
  const currentTool = useAtomValue(toolAtom);
  return (
    <Button
      className={cn(currentTool?.name === "Pencil" && "border-4 border-blue-500")}
      onClick={() => setTool(Pencil)}
    >
      <LucidePencil className="h-5 w-5" />
    </Button>
  );
}

export const Pencil: ToolObject = {
  name: "Pencil",
  render: PencilButton,
  use: draw,
};

function EraserButton({ setTool }: { setTool: (tool: ToolObject) => void }) {
  const currentTool = useAtomValue(toolAtom);
  return (
    <Button
      className={cn(currentTool?.name === "Eraser" && "border-4 border-blue-500")}
      onClick={() => setTool(Eraser)}
    >
      <EraserIcon className="h-5 w-5" />
    </Button>
  );
}

const erase = (ctx: CanvasRenderingContext2D) => {
  const gridX = store.get(gridXAtom);
  const gridY = store.get(gridYAtom);
  const gridCellSize = store.get(gridCellSizeAtom);
  // Calculate the top-left corner of the grid cell
  const cellTopLeftX = gridX * gridCellSize;
  const cellTopLeftY = gridY * gridCellSize;

  ctx.clearRect(cellTopLeftX, cellTopLeftY, gridCellSize, gridCellSize);
};

export const Eraser: ToolObject = {
  name: "Eraser",
  render: EraserButton,
  use: erase,
};

const eyedropper = (ctx: CanvasRenderingContext2D) => {
  const gridX = store.get(gridXAtom);
  const gridY = store.get(gridYAtom);
  const gridCellSize = store.get(gridCellSizeAtom);

  // Calculate the top-left corner of the grid cell
  const cellTopLeftX = gridX * gridCellSize;
  const cellTopLeftY = gridY * gridCellSize;

  // get color of the cell
  const cellColor = ctx.getImageData(
    cellTopLeftX + gridCellSize / 2,
    cellTopLeftY + gridCellSize / 2,
    1,
    1,
  ).data;

  // set the color of the cell
  store.set(colorAtom, new Color("#000000"));
};

export const Eyedropper: ToolObject = {
  name: "Eyedropper",
  render: EyedropperButton,
  use: eyedropper,
};

function EyedropperButton({
  setTool,
}: {
  setTool: (tool: ToolObject) => void;
}) {
  const currentTool = useAtomValue(toolAtom);
  return (
    <Button
      className={cn(currentTool?.name === "Eyedropper" && "border-4 border-blue-500")}
      onClick={() => setTool(Eyedropper)}
    >
      <Pipette className="h-5 w-5" />
    </Button>
  );
}

export const tools = [Pencil, Eraser, Eyedropper];
