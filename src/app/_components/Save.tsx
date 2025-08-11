import { Button } from "@/components/ui/button";
import { keyAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import React from "react";
import axios from "axios";

function Save({ pixels }: { pixels: Uint8Array }) {
  const key = useAtomValue(keyAtom);

  function saveImage() {
    void axios.post("/image", { rawBuffer: pixels, key });
    window.alert("Image sent to dashboard!");
  }

  return (
    <Button variant={"secondary"} onClick={saveImage}>
      Save/Send
    </Button>
  );
}

export default Save;
