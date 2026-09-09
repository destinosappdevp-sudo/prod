"use client";

import DestinationEditForm from "./DestinationEditForm";

type Props = Parameters<typeof DestinationEditForm>[0];

/** Rama multi-fecha: N salidas + selector de transporte. */
export default function DestinationEditFormMulti(props: Omit<Props, "legacyMode">) {
  return <DestinationEditForm {...props} legacyMode={false} />;
}
