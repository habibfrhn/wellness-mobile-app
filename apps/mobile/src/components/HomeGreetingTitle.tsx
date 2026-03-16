import React from "react";

import { id } from "../i18n/strings";
import SectionTitle from "./SectionTitle";

export default function HomeGreetingTitle() {
  return <SectionTitle title={id.home.greetingNoName} />;
}
