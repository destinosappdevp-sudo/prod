"use client";

import DestinationEditForm from "./DestinationEditForm";

type Props = Parameters<typeof DestinationEditForm>[0];

/** Rama antigua: 1 única fecha, sin selector de transporte (ENC32 fijo). */
export default function DestinationEditFormLegacy(props: Omit<Props, "legacyMode">) {
  return <DestinationEditForm {...props} legacyMode={true} />;
}
