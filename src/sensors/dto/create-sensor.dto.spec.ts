import { sensorInput } from '../../../test/support/fixtures.js';
import { createSensorSchema } from './create-sensor.dto.js';

describe('createSensorSchema', () => {
  it('accepts a valid sensor', () => {
    const result = createSensorSchema.safeParse(sensorInput);

    expect(result.success).toBe(true);
  });

  it.each([
    ['missing device ID', { deviceId: undefined }],
    ['empty device ID', { deviceId: '' }],
    ['missing name', { name: undefined }],
    ['short name', { name: 'A' }],
  ])('rejects %s', (_description, changes) => {
    const result = createSensorSchema.safeParse({
      ...sensorInput,
      ...changes,
    });

    expect(result.success).toBe(false);
  });

  it('strips extra properties', () => {
    const result = createSensorSchema.safeParse({
      ...sensorInput,
      extra: true,
    });

    expect(result).toEqual({ success: true, data: sensorInput });
  });
});
