import { supabase } from "./supabase";

export type FoundingMemberOptionValue =
  | "hampir_setiap_malam"
  | "beberapa_kali_seminggu"
  | "kadang_kadang"
  | "ya"
  | "mungkin"
  | "tidak"
  | "29000"
  | "49000"
  | "79000"
  | "99000_plus";

export type FoundingMemberFormValues = {
  name: string;
  email: string;
  sleepIssue: string;
  sleepFrequency: "" | FoundingMemberOptionValue;
  whyJoin: string;
  feedbackWillingness: "" | FoundingMemberOptionValue;
  interviewWillingness: "" | FoundingMemberOptionValue;
  paymentWillingness: "" | FoundingMemberOptionValue;
  preferredPrice: "" | FoundingMemberOptionValue;
  consentToContact: boolean;
};

export function getInitialFoundingMemberFormValues(): FoundingMemberFormValues {
  return {
    name: "",
    email: "",
    sleepIssue: "",
    sleepFrequency: "",
    whyJoin: "",
    feedbackWillingness: "",
    interviewWillingness: "",
    paymentWillingness: "",
    preferredPrice: "",
    consentToContact: false,
  };
}

export async function submitFoundingMemberForm(values: FoundingMemberFormValues) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { error: sessionError ?? new Error("Missing auth session") };
  }

  const { error } = await supabase.functions.invoke<{ ok: boolean }>("submit-founding-member", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {
      name: values.name.trim(),
      email: values.email.trim(),
      sleep_issue: values.sleepIssue.trim(),
      sleep_frequency: values.sleepFrequency,
      joining_reason: values.whyJoin.trim(),
      feedback_willingness: values.feedbackWillingness,
      interview_willingness: values.interviewWillingness,
      payment_willingness: values.paymentWillingness,
      preferred_monthly_price: values.preferredPrice,
      consent_to_contact: values.consentToContact,
    },
  });

  return { error };
}
