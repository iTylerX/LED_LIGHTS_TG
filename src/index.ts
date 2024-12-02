import type { API } from 'homebridge';
import { LEDLightsTGPlatform } from './platform';  // Assuming platform.ts exists
import { PLATFORM_NAME } from './settings';  // Assuming settings.ts exists

export function pluginName(api: API) {
  api.registerPlatform(PLATFORM_NAME, LEDLightsTGPlatform);
}
