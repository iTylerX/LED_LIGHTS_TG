import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import noble, { Peripheral } from '@abandonware/noble';
import { LEDLightsTGPlatform } from './platform';

export class LEDLightsTGAccessory {
  private service: Service;
  private connected = false;
  private devicePeripheral: Peripheral | null = null;

  constructor(
    private readonly platform: LEDLightsTGPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const device = accessory.context.device as { name: string; macAddress: string };

    this.service = this.accessory.getService(this.platform.Service.Lightbulb)
      || this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setPowerState.bind(this))
      .onGet(this.getPowerState.bind(this));

    noble.on('stateChange', this.handleNobleStateChange.bind(this));
    noble.on('discover', (peripheral: Peripheral) => this.handleDiscover(peripheral, device));
  }

  private handleNobleStateChange(state: string): void {
    if (state === 'poweredOn') {
      noble.startScanning([], false);
    } else {
      noble.stopScanning();
    }
  }

  private handleDiscover(peripheral: Peripheral, device: { name: string; macAddress: string }): void {
    if (peripheral.address === device.macAddress.toLowerCase()) {
      this.platform.log.info(`Discovered ${device.name}`);
      this.devicePeripheral = peripheral;

      noble.stopScanning();

      peripheral.connect((error: string | null) => {
        if (error) {
          this.platform.log.error(`Error connecting to ${device.name}: ${error}`);
          return;
        }
        this.connected = true;
        this.platform.log.info(`Connected to ${device.name}`);
      });

      peripheral.on('disconnect', () => {
        this.connected = false;
        this.platform.log.warn(`${device.name} disconnected.`);
        noble.startScanning([], false);
      });
    }
  }

  private async setPowerState(value: CharacteristicValue): Promise<void> {
    if (this.connected && this.devicePeripheral) {
      const command = value ? 'on' : 'off'; // Replace with actual command for your LED strip
      this.platform.log.info(`Setting ${this.accessory.displayName} to ${command}`);
      // Send the actual command to your device
    } else {
      this.platform.log.error(`Device ${this.accessory.displayName} is not connected.`);
    }
  }

  private async getPowerState(): Promise<CharacteristicValue> {
    return this.connected;
  }
}
