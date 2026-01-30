import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import ProfileContent from "../../components/ProfileContent";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Account">;

export default function ProfileScreen({}: Props) {
  const [emailValue, setEmailValue] = useState<string>("");
  const [nameValue, setNameValue] = useState<string>("");
  const [initialName, setInitialName] = useState<string>("");
  const maxNameLength = 15;

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        setEmailValue("");
        setNameValue("");
        setInitialName("");
      } else {
        setEmailValue(data.user?.email ?? "");
        const userName = (data.user?.user_metadata?.full_name as string | undefined) ?? "";
        setNameValue(userName);
        setInitialName(userName);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const trimmedName = nameValue.trim();
  const isNameTooLong = trimmedName.length > maxNameLength;
  const isSaveDisabled =
    trimmedName.length === 0 || trimmedName === initialName.trim() || isNameTooLong;

  async function onSaveName() {
    if (!trimmedName) {
      Alert.alert(id.common.errorTitle, id.account.nameRequired);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });

    if (error) {
      Alert.alert(id.common.errorTitle, error.message);
    } else {
      setInitialName(trimmedName);
      Alert.alert(id.account.nameSavedTitle, id.account.nameSavedBody);
    }
  }

  async function onLogout() {
    Alert.alert(id.account.confirmLogoutTitle, id.account.confirmLogoutBody, [
      { text: id.account.cancel, style: "cancel" },
      {
        text: id.account.logout,
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert(id.common.errorTitle, error.message);
        },
      },
    ]);
  }

  return (
    <ProfileContent
      email={emailValue}
      name={nameValue}
      onNameChange={setNameValue}
      onSaveName={onSaveName}
      isSaveDisabled={isSaveDisabled}
      isNameTooLong={isNameTooLong}
      onLogout={onLogout}
    />
  );
}
