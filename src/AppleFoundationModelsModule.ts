import { NativeModule, requireNativeModule } from 'expo';

import { AppleFoundationModelsModuleEvents } from './AppleFoundationModels.types';

declare class AppleFoundationModelsModule extends NativeModule<AppleFoundationModelsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AppleFoundationModelsModule>('AppleFoundationModels');
