"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export default function CookiesPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('value_str').eq('key','legal.cookies').maybeSingle();
      setContent((data?.value_str as string) || defaultContent);
    })();
  }, [supabase]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold">Cookie Policy</h1>
      <div className="prose prose-invert mt-4 whitespace-pre-wrap text-white/90">{content}</div>
    </div>
  );
}

const defaultContent = `We use cookies to provide essential site functionality and analyze traffic.

You can control cookies through your browser settings.`;

