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
    console.log(canvasAsBuffer.length)
    for (let px = 1; px < 65; px++) {
      for (let py = 1; py < 33; py++) {
        const pixel = ctx.getImageData(
          px * gridCellSize + (gridCellSize / 2),
          py * gridCellSize + (gridCellSize / 2),
          1,
          1,
        ).data;
        const indexInBuffer = (py * 64 + px) * 3;
        canvasAsBuffer[indexInBuffer + 0] = pixel[0]!;
        canvasAsBuffer[indexInBuffer + 1] = pixel[1]!;
        canvasAsBuffer[indexInBuffer + 2] = pixel[2]!;
      }
    }
    // POST canvasAsBuffer to server on route /image
    void axios.post("/image", { rawBuffer: canvasAsBuffer });
    window.alert("Image sent to dashboard!");
  }

  return (
    <Button variant={"secondary"} onClick={saveImage}>
      Save/Send
    </Button>
  );
}

export default Save;
