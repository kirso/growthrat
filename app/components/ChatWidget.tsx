"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./Chat").then((mod) => mod.Chat), {
  ssr: false,
});

export function ChatWidget() {
  return <Chat />;
}
