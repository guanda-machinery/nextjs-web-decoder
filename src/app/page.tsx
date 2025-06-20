"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import Reader from "@/features/FuncodeDecoder";

export default function HomePage() {
  const [scannedData, setScannedData] = useState<string>("");

  useEffect(() => {
    // TODO: send scannedData to server
    console.log("🔥 use effect decode success =>", scannedData);
  }, [scannedData]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="w-[300px] h-[300px]">
        <Reader
          delay={500}
          onError={(e: any) => console.log("onError =>", e)}
          onScan={(data: any) => {
            console.log("🔥 onScan =>", data);

            const jsonData = JSON.parse(data);

            if (jsonData.Barcodes.length > 0) {
              setScannedData(jsonData.Barcodes[0].Content);
            }
          }}
          startupcode="guandamachinelocal"
          debug
        />
      </div>

      <div className="text-lg font-bold">
        Scanned Data: {scannedData || "No data"}
      </div>

      <Link className="bg-blue-500 text-white px-4 py-2 rounded" href="/about">
        Go to About Page
      </Link>
    </div>
  );
}
