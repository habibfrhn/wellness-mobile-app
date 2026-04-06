import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { id } from "../../i18n/strings";
import { signOutToLogin } from "../../services/authSession";
import { supabase } from "../../services/supabase";
import ProfileContent from "../../components/ProfileContent";
import type { AppStackParamList } from "../../navigation/types";
import AppActionModal from "../../components/common/AppActionModal";

type Props = NativeStackScreenProps<AppStackParamList, "Account">;

export default function ProfileScreen(_props: Props) {
  const [emailValue, setEmailValue] = useState<string>("");
  const [nameValue, setNameValue] = useState<string>("");
  const [initialName, setInitialName] = useState<string>("");
  const maxNameLength = 15;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [busyLogout, setBusyLogout] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

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
    setShowLogoutModal(true);
  }

  async function onConfirmLogout() {
    setBusyLogout(true);
    const { error } = await signOutToLogin();
    if (error) {
      setLogoutError(error.message);
    }
    setBusyLogout(false);
    setShowLogoutModal(false);
  }

  return (
    <>
      <ProfileContent
        email={emailValue}
        name={nameValue}
        onNameChange={setNameValue}
        onSaveName={onSaveName}
        isSaveDisabled={isSaveDisabled}
        isNameTooLong={isNameTooLong}
        onLogout={onLogout}
      />

      <AppActionModal
        visible={showLogoutModal}
        title={id.account.confirmLogoutTitle}
        description={id.account.confirmLogoutBody}
        confirmLabel={busyLogout ? id.login.busyCta : id.account.logout}
        cancelLabel={id.account.cancel}
        busy={busyLogout}
        onCancel={() => {
          if (!busyLogout) {
            setShowLogoutModal(false);
          }
        }}
        onConfirm={() => {
          void onConfirmLogout();
        }}
      />

      <AppActionModal
        visible={Boolean(logoutError)}
        title={id.common.errorTitle}
        description={logoutError ?? ""}
        confirmLabel={id.common.ok}
        onCancel={() => setLogoutError(null)}
        onConfirm={() => setLogoutError(null)}
      />
    </>
  );
}
