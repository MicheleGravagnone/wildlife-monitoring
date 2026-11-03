import { DetectionsController } from './detections.controller.js';
import { DetectionsService } from './detections.service.js';

// Use an actual service as a typed fixture source; controller calls use mocks.
describe('DetectionsController', () => {
  const detection = new DetectionsService().getAll()[0];
  let controller: DetectionsController;
  let service: Pick<DetectionsService, 'getAll' | 'getOne'>;

  beforeEach(() => {
    service = {
      getAll: vi.fn().mockReturnValue([detection]),
      getOne: vi.fn().mockReturnValue(detection),
    };
    controller = new DetectionsController(service as DetectionsService);
  });

  it('returns the service list', () => {
    expect(controller.getAll()).toEqual([detection]);
    expect(service.getAll).toHaveBeenCalledExactlyOnceWith();
  });

  it('passes the requested ID to the service', () => {
    expect(controller.getOne(detection.id)).toEqual(detection);
    expect(service.getOne).toHaveBeenCalledExactlyOnceWith(detection.id);
  });

  it('returns undefined when the service cannot find a detection', () => {
    vi.mocked(service.getOne).mockReturnValue(undefined);
    expect(controller.getOne(detection.id)).toBeUndefined();
  });
});
