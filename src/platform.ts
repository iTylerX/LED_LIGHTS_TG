import * as Noble from '@abandonware/noble';  // Corrected import

// Other imports
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { LEDLightsTGAccessory } from './platformAccessory';
import { Peripheral } from '@abandonware/noble';  // Import Peripheral type

interface DeviceConfig {
  name: string;
  macAddress: string;
  BT_Name: string;  // Added BT_Name field for Bluetooth identification
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

  private async initializeAccessories(): Promise<void> {
    (this.config.devices as DeviceConfig[]).forEach(async (deviceConfig) => {
      const uuid = this.api.hap.uuid.generate(deviceConfig.macAddress);
      let accessory = this.accessories.find(acc => acc.UUID === uuid);
  
      if (!accessory) {
        this.log.info(`Adding new accessory: ${deviceConfig.name}`);
        accessory = new this.api.platformAccessory(deviceConfig.name, uuid);
        accessory.context.device = deviceConfig;
        this.api.registerPlatformAccessories('LED_LIGHTS_TG', 'LED_LIGHTS_TG', [accessory]);
      }
  
      // Use the BT_Name to find and connect to the Bluetooth device
      const peripheral = await this.findPeripheralByName(deviceConfig.BT_Name);
  
      if (peripheral) {
        this.log.info(`Found Bluetooth device: ${deviceConfig.BT_Name}`);
        // Store the peripheral in the context (or handle it differently)
        accessory.context.peripheral = peripheral;
        // Now pass only the required arguments to the LEDLightsTGAccessory constructor
        new LEDLightsTGAccessory(this, accessory);
      } else {
        this.log.error(`Bluetooth device ${deviceConfig.BT_Name} not found.`);
      }
    });
  }  

  // Function to find a Bluetooth peripheral by its name (BT_Name)
  private async findPeripheralByName(BT_Name: string): Promise<Peripheral | null> {
    return new Promise((resolve, reject) => {
      Noble.on('stateChange', async (state: string) => {
        if (state === 'poweredOn') {
          Noble.startScanning([], false);

          Noble.on('discover', (peripheral: Peripheral) => {
            if (peripheral.advertisement.localName === BT_Name) {
              Noble.stopScanning();
              resolve(peripheral);
            }
          });

          setTimeout(() => {
            Noble.stopScanning();
            reject(new Error(`Bluetooth device ${BT_Name} not found within timeout`));
          }, 10000); // 10 seconds timeout
        } else {
          reject(new Error('Bluetooth not powered on'));
        }
      });
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }
}
