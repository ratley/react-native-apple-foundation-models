import { registerWebModule, NativeModule } from 'expo';

import { AppleFoundationModelsModuleEvents } from './AppleFoundationModels.types';

class AppleFoundationModelsModule extends NativeModule<AppleFoundationModelsModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(AppleFoundationModelsModule, 'AppleFoundationModelsModule');
