import { LimitedPeripheralData, PeripheralData } from './ble.types';

import { PressureDevice, psiToBar } from './pressureBluetoothDevice';
import { parseAdvertisingManufacturerData, to128bitUUID } from './common/util';

declare var ble: any;
export class BooKooPressure extends PressureDevice {
  public static PRESSURE_SERVICE_UUID = to128bitUUID('0FFF');
  public static PRESSURE_CHAR_UUID = to128bitUUID('FF02');

  constructor(data: PeripheralData) {
    super(data);
    this.connect();
  }

  public static test(device: LimitedPeripheralData): boolean {
    const adv =
      device &&
      device.advertising &&
      parseAdvertisingManufacturerData(device.advertising);
    return adv && adv.length >= 2 && adv[0] === 0xea && adv[1] === 0xf0;
  }

  public connect() {
    this.attachNotification();

    setTimeout(() => {
      this.updateZero().catch(() => {});
    }, 1000);
  }

  public updateZero(): Promise<void> {
    return new Promise((resolve, reject) => {});
  }

  public disconnect() {
    this.deattachNotification();
  }

  private attachNotification() {
    ble.startNotification(
      this.device_id,
      BooKooPressure.PRESSURE_SERVICE_UUID,
      BooKooPressure.PRESSURE_CHAR_UUID,
      async (_data: any) => {
        const v = new Float32Array(_data);
        const psi = v[0];
        this.setPressure(psiToBar(psi), _data, v);
      },
      (_data: any) => {}
    );
  }

  private deattachNotification() {
    ble.stopNotification(
      this.device_id,
      BooKooPressure.PRESSURE_SERVICE_UUID,
      BooKooPressure.PRESSURE_CHAR_UUID,
      (e: any) => {},
      (e: any) => {}
    );
  }
}
