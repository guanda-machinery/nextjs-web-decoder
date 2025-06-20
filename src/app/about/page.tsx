"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div>再度返回首頁後，Reader 元件將無法正常掃描</div>

      <Link className="bg-blue-500 text-white px-4 py-2 rounded" href="/">
        Go to Home Page
      </Link>
    </div>
  );
}
