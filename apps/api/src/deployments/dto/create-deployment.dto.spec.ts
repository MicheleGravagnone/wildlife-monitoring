import { deploymentInput } from '../../../test/support/fixtures.js';
import { createDeploymentSchema } from './create-deployment.dto.js';

describe('createDeploymentSchema', () => {
  it('accepts a valid deployment', () => {
    const result = createDeploymentSchema.safeParse(deploymentInput);

    expect(result.success).toBe(true);
  });

  it.each([
    ['invalid sensor ID', { sensorId: 'invalid' }],
    ['missing name', { name: undefined }],
    ['short name', { name: 'A' }],
    ['missing park name', { parkName: undefined }],
    ['short park name', { parkName: 'A' }],
    ['latitude below minimum', { latitude: -90.01 }],
    ['latitude above maximum', { latitude: 90.01 }],
    ['longitude below minimum', { longitude: -180.01 }],
    ['longitude above maximum', { longitude: 180.01 }],
    ['invalid installation date', { installedAt: 'invalid' }],
    ['extra property', { extra: true }],
  ])('rejects %s', (_description, changes) => {
    const result = createDeploymentSchema.safeParse({
      ...deploymentInput,
      ...changes,
    });

    expect(result.success).toBe(false);
  });
});
