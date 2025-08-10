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
  keyAtom,
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
  const [key, setKey] = useAtom(keyAtom);
  const [canvasFirstLoad, setCanvasFirstLoad] = useState(false);
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
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      const availableWidth = isMobile
        ? window.innerWidth * 0.9
        : window.innerWidth * 0.7;
      const gridCellSize = availableWidth / 64;
      setGridCellSize(gridCellSize);
      canvasRef.current.width = gridCellSize * 64;
      canvasRef.current.height = gridCellSize * 32;
    }
  };

  useEffect(() => {
    setTool(Pencil);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    // Check for key parameter in URL and set it automatically
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get("key");
    if (keyFromUrl) {
      setKey(keyFromUrl);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [setKey]);

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

    if (!canvasFirstLoad && key) {
      loadCurrentImage();
      setCanvasFirstLoad(true);
    }

    drawGrid(ctx);
  }, [canvasRef, drawGrid, gridCellSize, key]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
  };

  const loadCurrentImage = async () => {
    if (!key || !canvasRef.current) return;

    try {
      const response = await fetch(`/image?key=${encodeURIComponent(key)}`);
      if (!response.ok) {
        return;
      }
      const imageData = (await response.json()) as {
        key: string;
        id: string;
        rawBuffer: string;
      };

      if (!imageData.rawBuffer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Ensure canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        console.error("Canvas has invalid dimensions");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
        return;
      }

      // Parse the raw buffer
      const buffer = JSON.parse(imageData.rawBuffer) as {
        [key: number]: number;
      };

      // Convert buffer object to array
      const bufferArray = Object.values(buffer);

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx);

      // Store current tool and color
      const currentTool = tool;
      const currentColor = color;

      // Set to Pencil tool for drawing
      setTool(Pencil);

      // Draw each pixel using the Pencil tool
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
          const pixelIndex = (y * 64 + x) * 3; // 3 bytes per pixel (RGB)

          const r = bufferArray[pixelIndex] || 0;
          const g = bufferArray[pixelIndex + 1] || 0;
          const b = bufferArray[pixelIndex + 2] || 0;

          // Only draw if the pixel is not black (has some color)
          if (r > 0 || g > 0 || b > 0) {
            // Calculate canvas coordinates for this grid cell
            const canvasX = x * gridCellSize;
            const canvasY = y * gridCellSize;

            // Use the Pencil tool to draw this pixel
            const tempCtx = canvas.getContext("2d");
            if (tempCtx) {
              // Fill the entire grid cell with the color
              tempCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
              tempCtx.fillRect(canvasX, canvasY, gridCellSize, gridCellSize);
            }
          }
        }
      }

      // Restore original tool and color
      setTool(currentTool);
      setColor(currentColor);

      console.log("Image drawn using Pencil tool");
    } catch (error) {
      console.error("Error loading current image:", error);
    }
  };

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-slate-900 pt-4 lg:flex-row">
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
        onMouseLeave={() => {
          setIsUsingTool(false);
        }}
        onClick={(e) => {
          if (!canvasRef.current) return;
        }}
        onMouseMove={(e) => {
          if (!canvasRef.current) return;
          setMouseX(e.clientX - canvasRef.current.offsetLeft);
          setMouseY(e.clientY - canvasRef.current.offsetTop);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (e.touches.length > 0) {
            setIsUsingTool(true);
            const touch = e.touches[0];
            if (touch) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect && canvasRef.current) {
                setMouseX(touch.clientX - rect.left);
                setMouseY(touch.clientY - rect.top);
              }
            }
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          setIsUsingTool(false);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (!canvasRef.current || e.touches.length === 0) return;
          const touch = e.touches[0];
          if (touch) {
            const rect = canvasRef.current.getBoundingClientRect();
            setMouseX(touch.clientX - rect.left);
            setMouseY(touch.clientY - rect.top);
          }
        }}
        ref={canvasRef}
        width={gridCellSize * 64}
        height={gridCellSize * 32}
        className="w-full touch-none bg-black lg:ml-8 lg:w-[70%]"
        style={{ touchAction: "none" }}
      />
      <div className="flex w-full flex-col items-center justify-center gap-4 p-4 lg:w-[30%]">
        <div className="flex flex-row flex-wrap items-center justify-center gap-2 lg:gap-4">
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
        <div className="origin-center scale-75 lg:scale-100">
          <SketchPicker
            color={color.hex()}
            onChangeComplete={(colorObj) => {
              setColor(new Color(colorObj.hex));
            }}
          />
        </div>
        <p className="text-sm text-gray-500">
          Use this key to make a request to this site to get the stringified
          image data. This lets you display the image in whatever you're doing.
          Use it as a query param to the /image route, i.e.
          https://led-dashboard-web.vercel.app/image?key={key}
        </p>
        <input
          type="password"
          placeholder="Key"
          className="w-full"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          name="led-dashboard-key"
          id="led-dashboard-key"
          autoComplete="current-password"
        ></input>
        <Save ctx={canvasRef.current?.getContext("2d") ?? null} />
      </div>
    </main>
  );
}
