"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";

export function TopLoader() {
  const pathname = usePathname();
  const isNavigating = useUIStore((s) => s.isNavigating);
  const setNavigating = useUIStore((s) => s.setNavigating);

  const barRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prevPath = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Global anchor click listener — catches ALL <Link> and <a> navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash-only links, and mailto/tel
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) return;

      // Skip if it's the same page
      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === window.location.pathname) return;

      // Skip if modifier keys held (open in new tab etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Skip if target="_blank"
      if (anchor.getAttribute("target") === "_blank") return;

      setNavigating(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [setNavigating]);

  // Path change = navigation done → complete the bar
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setNavigating(false);
    }
  }, [pathname, setNavigating]);

  useEffect(() => {
    const bar = barRef.current;
    const wrap = wrapRef.current;
    if (!bar || !wrap) return;
    clear();

    if (isNavigating) {
      // Show and start crawling
      wrap.style.opacity = "1";
      bar.style.transition = "none";
      bar.style.width = "0%";

      timers.current.push(setTimeout(() => {
        bar.style.transition = "width 0.4s ease-out";
        bar.style.width = "30%";
      }, 20));

      timers.current.push(setTimeout(() => {
        bar.style.transition = "width 1.5s ease-in-out";
        bar.style.width = "75%";
      }, 500));

      timers.current.push(setTimeout(() => {
        bar.style.transition = "width 3s ease-in-out";
        bar.style.width = "90%";
      }, 2500));
    } else {
      // Only animate completion if the bar was visible
      const currentWidth = parseFloat(bar.style.width || "0");
      if (currentWidth > 0) {
        bar.style.transition = "width 0.25s ease-out";
        bar.style.width = "100%";

        timers.current.push(setTimeout(() => {
          wrap.style.transition = "opacity 0.3s ease";
          wrap.style.opacity = "0";
        }, 280));

        timers.current.push(setTimeout(() => {
          bar.style.transition = "none";
          bar.style.width = "0%";
          wrap.style.transition = "none";
        }, 600));
      }
    }

    return clear;
  }, [isNavigating]);

  return (
    <div
      ref={wrapRef}
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      style={{ opacity: 0 }}
    >
      <div
        ref={barRef}
        className="h-full w-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400"
        style={{ boxShadow: "0 0 8px 1px rgba(99,102,241,0.6)" }}
      />
    </div>
  );
}
