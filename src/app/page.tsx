"use client";
import { Dotting } from "dotting";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Color from "color";
import { SketchPicker } from "react-color";
import { Pencil, ToolObject, tools } from "./_components/Tools";
import { useAtom } from "jotai";
import {
  colorAtom,
  gridCellSizeAtom,
  gridXAtom,
  gridYAtom,
  isUsingToolAtom,
  mouseXAtom,
  mouseYAtom,
  toolAtom,
} from "@/lib/atoms";
import { Button } from "@/components/ui/button";
import Save from "./_components/Save";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridCellSize, setGridCellSize] = useAtom(gridCellSizeAtom);
  const [tool, setTool] = useAtom(toolAtom);
  const [color, setColor] = useAtom(colorAtom);
  const [mouseX, setMouseX] = useAtom(mouseXAtom);
  const [mouseY, setMouseY] = useAtom(mouseYAtom);
  const [gridX, setGridX] = useAtom(gridXAtom);
  const [gridY, setGridY] = useAtom(gridYAtom);
  const [isUsingTool, setIsUsingTool] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (isUsingTool) {
      if (!tool) setTool(Pencil);
      console.log(gridX, gridY, gridCellSize);
      tool!.use(ctx);
    }
    drawGrid(ctx);
  }, [gridX, gridY, gridCellSize, isUsingTool]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate grid cell indices based on mouse position
      const gridX = Math.floor(mouseX / gridCellSize);
      const gridY = Math.floor(mouseY / gridCellSize);

      if (isNaN(gridX) || isNaN(gridY)) return;

      setGridX(gridX);
      setGridY(gridY);
    }
  }, [mouseX, mouseY, gridCellSize]);

  const resizeCanvas = () => {
    if (canvasRef.current) {
      // resize the canvas so it fits entirely within the window
      const gridCellSize = (window.innerWidth * 0.7) / 64;
      setGridCellSize(gridCellSize);
      canvasRef.current.width = gridCellSize * 64;
      canvasRef.current.height = gridCellSize * 32;
    }
  };

  useEffect(() => {
    setTool(Pencil);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    ctx.lineWidth = 1;
    for (let i = 0; i < 64; i++) {
      ctx.beginPath();
      ctx.strokeStyle = "#666666";
      ctx.moveTo(i * gridCellSize, 0);
      ctx.lineTo(i * gridCellSize, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < 32; i++) {
      ctx.beginPath();
      ctx.strokeStyle = "#666666";
      ctx.moveTo(0, i * gridCellSize);
      ctx.lineTo(canvas.width, i * gridCellSize);
      ctx.stroke();
    }

    // draw the lines at the right and bottom edges
    ctx.beginPath();
    ctx.strokeStyle = "#666666";
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "#666666";
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx);
  }, [canvasRef, drawGrid, gridCellSize]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
  };

  return (
    <main className="flex flex-row items-center justify-center pt-4 bg-slate-900 h-screen">
      <canvas
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsUsingTool(true);
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 0) {
            setIsUsingTool(false);
          }
        }}
        onClick={(e) => {
          if (!canvasRef.current) return;
        }}
        onMouseMove={(e) => {
          if (!canvasRef.current) return;
          setMouseX(e.clientX - canvasRef.current.offsetLeft);
          setMouseY(e.clientY - canvasRef.current.offsetTop);
        }}
        ref={canvasRef}
        width={gridCellSize * 64}
        height={gridCellSize * 32}
        className="ml-8 w-[70%] bg-black"
      />
      <div className="flex w-[30%] flex-col items-center justify-center gap-4">
        <div className="flex flex-row items-center justify-center gap-4">
          {tools.map((tool) => tool.render({ setTool }))}
          <Button
            variant={"secondary"}
            onClick={() => {
              setTool(Pencil);
              setColor(new Color("#000000"));
              clear();
            }}
          >
            Clear
          </Button>
        </div>
        <div className="flex flex-row items-center justify-center">
          <p className="font-bold" style={{ color: color.hex() }}>
            Current Color: {color.hex()}
          </p>
        </div>
        <SketchPicker
          color={color.hex()}
          onChangeComplete={(colorObj) => {
            setColor(new Color(colorObj.hex));
          }}
        />
        <Save ctx={canvasRef.current?.getContext("2d") ?? null} />
      </div>
    </main>
  );
}
