import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { LEDLightsTGAccessory } from './platformAccessory';

interface DeviceConfig {
  name: string;
  macAddress: string;
}

export class LEDLightsTGPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  private readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    if (!this.config.devices || !Array.isArray(this.config.devices)) {
      this.log.error('No devices configured. Please check your config.json.');
      return;
    }

    this.api.on('didFinishLaunching', () => {
      this.log.info('Finished launching LED_LIGHTS_TG platform.');
      this.initializeAccessories();
    });    
  }

  private initializeAccessories(): void {
    (this.config.devices as DeviceConfig[]).forEach((deviceConfig) => {
      const uuid = this.api.hap.uuid.generate(deviceConfig.macAddress);
      let accessory = this.accessories.find(acc => acc.UUID === uuid);

      if (!accessory) {
        this.log.info(`Adding new accessory: ${deviceConfig.name}`);
        accessory = new this.api.platformAccessory(deviceConfig.name, uuid);
        accessory.context.device = deviceConfig;
        this.api.registerPlatformAccessories('LED_LIGHTS_TG', 'LED_LIGHTS_TG', [accessory]);
      }

      new LEDLightsTGAccessory(this, accessory);
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }
}
