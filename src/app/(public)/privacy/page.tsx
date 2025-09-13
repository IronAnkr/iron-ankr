"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export default function PrivacyPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('value_str').eq('key','legal.privacy').maybeSingle();
      setContent((data?.value_str as string) || defaultContent);
    })();
  }, [supabase]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <div className="prose prose-invert mt-4 whitespace-pre-wrap text-white/90">{content}</div>
    </div>
  );
}

const defaultContent = `We respect your privacy.

We only collect information necessary to fulfill your orders and improve your experience. We do not sell your data.

For questions, contact support@iron-ankr.com.`;

