import { Platform } from "react-native";

import { colors } from "./tokens";

export const sharedCardShadowStyle =
  Platform.OS === "web"
    ? { boxShadow: `0px 4px 12px ${colors.text}14` }
    : {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
      };
