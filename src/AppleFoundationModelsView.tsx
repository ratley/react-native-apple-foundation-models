import { requireNativeView } from 'expo';
import * as React from 'react';

import { AppleFoundationModelsViewProps } from './AppleFoundationModels.types';

const NativeView: React.ComponentType<AppleFoundationModelsViewProps> =
  requireNativeView('AppleFoundationModels');

export default function AppleFoundationModelsView(props: AppleFoundationModelsViewProps) {
  return <NativeView {...props} />;
}
