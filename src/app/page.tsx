"use client";

import React from "react";

import Reader from "@/features/FuncodeDecoder";

export default function HomePage() {
  return (
    <div className="w-[300px] h-[300px]">
      <Reader
        delay={500}
        onError={(e: any) => console.log("decode error =>", e)}
        onScan={(data: any) => console.log("🔥 decode success =>", data)}
        startupcode="guandamachinelocal"
        debug
      />
    </div>
  );
}
