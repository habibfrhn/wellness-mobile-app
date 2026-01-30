import React, { useEffect, useState } from "react";

import { supabase } from "../services/supabase";
import { id } from "../i18n/strings";
import SectionTitle from "./SectionTitle";

export default function HomeGreetingTitle() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const loadName = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const fullName = (data.user?.user_metadata?.full_name as string | undefined) ?? "";
      setName(fullName);
    };

    loadName();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const fullName = (session?.user?.user_metadata?.full_name as string | undefined) ?? "";
      if (mounted) setName(fullName);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const trimmedName = name.trim();
  const greeting = trimmedName
    ? id.home.greetingWithName.replace("{name}", trimmedName)
    : id.home.greetingNoName;

  return <SectionTitle title={greeting} />;
}
