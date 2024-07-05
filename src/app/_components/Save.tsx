import { Button } from "@/components/ui/button";
import { gridCellSizeAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import React from "react";
import axios from "axios";
function Save({ ctx }: { ctx: CanvasRenderingContext2D | null }) {
  const gridCellSize = useAtomValue(gridCellSizeAtom);
  if (!ctx) return null;

  function saveImage() {
    if (!ctx) return;
    const canvasAsBuffer: Uint8Array = new Uint8Array(64 * 32 * 3);
    for (let px = 1; px < 65; px++) {
      for (let py = 1; py < 33; py++) {
        const pixel = ctx.getImageData(
          px * gridCellSize + (gridCellSize / 2),
          py * gridCellSize + (gridCellSize / 2),
          1,
          1,
        ).data;
        const indexInBuffer = (py * 64 + px) * 3;
        canvasAsBuffer[indexInBuffer + 0] = pixel[0] as number;
        canvasAsBuffer[indexInBuffer + 1] = pixel[1] as number;
        canvasAsBuffer[indexInBuffer + 2] = pixel[2] as number;
      }
    }
    // POST canvasAsBuffer to server on route /image
    axios.post("/image", { rawBuffer: canvasAsBuffer });
  }

  return <Button onClick={saveImage}>Save/Send</Button>;
}

export default Save;
