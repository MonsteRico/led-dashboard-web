"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Color from "color";
import { SketchPicker } from "react-color";
import { Pencil, tools } from "./_components/Tools";
import { useAtom } from "jotai";
import {
  colorAtom,
  gridCellSizeAtom,
  gridXAtom,
  gridYAtom,
  keyAtom,
  mouseXAtom,
  mouseYAtom,
  toolAtom,
  store,
} from "@/lib/atoms";
import { Button } from "@/components/ui/button";
import Save from "./_components/Save";

export default function HomePage() {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Global state
  const [gridCellSize, setGridCellSize] = useAtom(gridCellSizeAtom);
  const [tool, setTool] = useAtom(toolAtom);
  const [color, setColor] = useAtom(colorAtom);
  const [key, setKey] = useAtom(keyAtom);

  // Mouse and grid position state
  const [mouseX, setMouseX] = useAtom(mouseXAtom);
  const [mouseY, setMouseY] = useAtom(mouseYAtom);
  const [gridX, setGridX] = useAtom(gridXAtom);
  const [gridY, setGridY] = useAtom(gridYAtom);

  // Local state
  const [isUsingTool, setIsUsingTool] = useState(false);
  const [canvasFirstLoad, setCanvasFirstLoad] = useState(false);
  const [pixels, setPixels] = useState<Uint8Array>(new Uint8Array(64 * 32 * 3));

  // Ref to access current pixels without causing re-renders
  const pixelsRef = useRef<Uint8Array>(new Uint8Array(64 * 32 * 3));

  // Function to update a pixel in the array
  const updatePixel = useCallback(
    (x: number, y: number, r: number, g: number, b: number) => {
      setPixels((prevPixels) => {
        const newPixels = new Uint8Array(prevPixels);
        const index = (y * 64 + x) * 3;
        newPixels[index] = r;
        newPixels[index + 1] = g;
        newPixels[index + 2] = b;
        pixelsRef.current = newPixels;
        return newPixels;
      });
    },
    [],
  );

  // Helper function to get grid position from mouse/touch coordinates
  const getGridPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };

      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;

      // Calculate the scale factor between CSS size and actual canvas size
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Convert to actual canvas coordinates
      const actualX = canvasX * scaleX;
      const actualY = canvasY * scaleY;

      // Convert to grid coordinates
      const gridX = Math.floor(actualX / gridCellSize);
      const gridY = Math.floor(actualY / gridCellSize);

      // Clamp to valid grid range
      return {
        x: Math.max(0, Math.min(63, gridX)),
        y: Math.max(0, Math.min(31, gridY)),
      };
    },
    [gridCellSize],
  );

  // Function to draw pixels from array to canvas
  const drawPixelsToCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw each pixel from the array
    for (let x = 0; x < 64; x++) {
      for (let y = 0; y < 32; y++) {
        const index = (y * 64 + x) * 3;
        const r = pixels[index] ?? 0;
        const g = pixels[index + 1] ?? 0;
        const b = pixels[index + 2] ?? 0;

        // Only draw non-black pixels
        if (r > 0 || g > 0 || b > 0) {
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(
            x * gridCellSize,
            y * gridCellSize,
            gridCellSize,
            gridCellSize,
          );
        }
      }
    }

    // Draw the grid
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

    // Draw border lines
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
  }, [pixels, gridCellSize]);

  // Handle tool usage
  useEffect(() => {
    if (isUsingTool && tool) {
      if (tool.name === "Pencil") {
        const color = store.get(colorAtom);
        const rgb = color.rgb().array();
        updatePixel(gridX, gridY, rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0);
      } else if (tool.name === "Eraser") {
        updatePixel(gridX, gridY, 0, 0, 0);
      } else if (tool.name === "Eyedropper") {
        const index = (gridY * 64 + gridX) * 3;
        const r = pixelsRef.current[index] ?? 0;
        const g = pixelsRef.current[index + 1] ?? 0;
        const b = pixelsRef.current[index + 2] ?? 0;

        store.set(colorAtom, new Color([r, g, b]));
      }
    }
  }, [isUsingTool, tool, gridX, gridY, updatePixel]);

  // Update pixelsRef when pixels change
  useEffect(() => {
    pixelsRef.current = pixels;
  }, [pixels]);

  // Redraw canvas when pixels or grid size changes
  useEffect(() => {
    drawPixelsToCanvas();
  }, [pixels, gridCellSize, drawPixelsToCanvas]);

  // Resize canvas based on window dimensions
  const resizeCanvas = useCallback(() => {
    const isMobile = window.innerWidth < 1024;
    let newGridCellSize: number;

    if (isMobile) {
      const maxWidth = window.innerWidth * 0.85;
      const maxHeight = window.innerHeight * 0.6;
      const cellSizeFromWidth = maxWidth / 64;
      const cellSizeFromHeight = maxHeight / 32;
      newGridCellSize = Math.min(cellSizeFromWidth, cellSizeFromHeight);
    } else {
      const availableWidth = window.innerWidth * 0.7;
      newGridCellSize = availableWidth / 64;
    }

    if (canvasRef.current) {
      canvasRef.current.width = newGridCellSize * 64;
      canvasRef.current.height = newGridCellSize * 32;
    }

    setGridCellSize(newGridCellSize);
  }, [setGridCellSize]);

  useEffect(() => {
    setTool(Pencil);

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    resizeCanvas();

    // Check for key parameter in URL and set it automatically
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get("key");
    if (keyFromUrl) {
      setKey(keyFromUrl);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setKey, resizeCanvas]);

  useEffect(() => {
    if (!canvasFirstLoad && key) {
      loadCurrentImage();
      setCanvasFirstLoad(true);
    }
  }, [key, canvasFirstLoad]);

  const clear = () => {
    // Clear the pixel array
    const emptyPixels = new Uint8Array(64 * 32 * 3);
    setPixels(emptyPixels);
    pixelsRef.current = emptyPixels;
  };

  const loadCurrentImage = async () => {
    if (!key) return;

    try {
      const response = await fetch(`/image?key=${encodeURIComponent(key)}`);
      if (!response.ok) return;

      const imageData = (await response.json()) as {
        key: string;
        id: string;
        rawBuffer: string;
      };

      if (!imageData.rawBuffer) return;

      const buffer = JSON.parse(imageData.rawBuffer) as {
        [key: number]: number;
      };

      const bufferArray = Object.values(buffer);
      const newPixels = new Uint8Array(64 * 32 * 3);

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
          const pixelIndex = (y * 64 + x) * 3;
          const r = bufferArray[pixelIndex] || 0;
          const g = bufferArray[pixelIndex + 1] || 0;
          const b = bufferArray[pixelIndex + 2] || 0;

          newPixels[pixelIndex] = r;
          newPixels[pixelIndex + 1] = g;
          newPixels[pixelIndex + 2] = b;
        }
      }

      setPixels(newPixels);
      pixelsRef.current = newPixels;
    } catch (error) {
      console.error("Error loading current image:", error);
    }
  };

  return (
    <main className="flex h-screen flex-col items-center justify-center overflow-hidden bg-slate-900 p-4 lg:flex-row">
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
        onMouseMove={(e) => {
          if (!canvasRef.current) return;
          const { x, y } = getGridPosition(e.clientX, e.clientY);
          setMouseX(x * gridCellSize + gridCellSize / 2);
          setMouseY(y * gridCellSize + gridCellSize / 2);
          setGridX(x);
          setGridY(y);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (e.touches.length > 0) {
            setIsUsingTool(true);
            const touch = e.touches[0];
            if (touch) {
              const { x, y } = getGridPosition(touch.clientX, touch.clientY);
              setMouseX(x * gridCellSize + gridCellSize / 2);
              setMouseY(y * gridCellSize + gridCellSize / 2);
              setGridX(x);
              setGridY(y);
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
            const { x, y } = getGridPosition(touch.clientX, touch.clientY);
            setMouseX(x * gridCellSize + gridCellSize / 2);
            setMouseY(y * gridCellSize + gridCellSize / 2);
            setGridX(x);
            setGridY(y);
          }
        }}
        ref={canvasRef}
        width={gridCellSize * 64}
        height={gridCellSize * 32}
        className="w-full touch-none bg-black lg:w-[70%]"
        style={{ touchAction: "none", userSelect: "none" }}
      />
      <div className="flex max-h-screen w-full flex-col items-center justify-center gap-2 overflow-y-auto p-2 lg:w-[30%] lg:gap-4 lg:p-4">
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
          <Button
            variant={"secondary"}
            onClick={() => {
              setTool(Pencil);
              loadCurrentImage();
            }}
          >
            Reset to current image
          </Button>
        </div>
        <div className="flex flex-row items-center justify-center">
          <p className="font-bold" style={{ color: color.hex() }}>
            Current Color: {color.hex()}
          </p>
        </div>
        <div className="origin-center scale-50 lg:scale-100">
          <SketchPicker
            color={color.hex()}
            onChangeComplete={(colorObj) => {
              setColor(new Color(colorObj.hex));
            }}
          />
        </div>
        <p className="text-center text-xs text-gray-500 lg:text-sm">
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
        <Save pixels={pixels} />
      </div>
    </main>
  );
}
