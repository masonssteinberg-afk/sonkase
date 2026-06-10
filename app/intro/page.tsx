"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SushiSlice from "../components/SushiSlice";

export default function IntroPage() {
  const router = useRouter();

  const handleEnter = () => router.push("/");

  useEffect(() => {
    const t = setTimeout(handleEnter, 12000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0d0d0d" }}>
      <SushiSlice onEnter={handleEnter} />
    </div>
  );
}
