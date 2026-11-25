import {
  StandardSchemaValidationPipe,
  VersioningType,
  type INestApplication,
} from '@nestjs/common';

/** Routes are served under /api/v<version>, e.g. /api/v1/sensors. */
export const API_PREFIX = 'api';
export const DEFAULT_API_VERSION = '1';

/** HTTP configuration shared by the server and the end-to-end tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: DEFAULT_API_VERSION,
  });
  app.useGlobalPipes(new StandardSchemaValidationPipe());
}
