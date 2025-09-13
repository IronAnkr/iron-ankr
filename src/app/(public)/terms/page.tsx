"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export default function TermsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('value_str').eq('key','legal.terms').maybeSingle();
      setContent((data?.value_str as string) || defaultContent);
    })();
  }, [supabase]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <div className="prose prose-invert mt-4 whitespace-pre-wrap text-white/90">{content}</div>
    </div>
  );
}

const defaultContent = `These terms govern your use of our site and products.

By placing an order, you agree to these terms. For questions, contact support@iron-ankr.com.`;

