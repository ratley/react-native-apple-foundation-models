// Reexport the native module. On web, it will be resolved to AppleFoundationModelsModule.web.ts
// and on native platforms to AppleFoundationModelsModule.ts
export { default } from './AppleFoundationModelsModule';
export { default as AppleFoundationModelsView } from './AppleFoundationModelsView';
export * from  './AppleFoundationModels.types';
