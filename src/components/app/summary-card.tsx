"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function SummaryCard({ label, value, detail, icon, href }: { label: string; value: string; detail: string; icon: ReactNode; href?: string }) {
  const content = (
    <Card className="border-[#e6e8ec] bg-white">
      <CardContent className="flex items-start justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">{label}</p>
          <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-neutral-950">{value}</p>
          <p className="mt-1.5 max-w-[18rem] text-sm leading-5 text-neutral-500">{detail}</p>
        </div>
        <div className="text-neutral-500">{icon}</div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.14, ease: "easeOut" }}>
      {href ? <a href={href}>{content}</a> : content}
    </motion.div>
  );
}
