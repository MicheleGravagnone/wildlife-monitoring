import { Injectable } from '@nestjs/common';
import type { Detection } from './types/detection.type.js';

@Injectable()
export class DetectionsService {

    getAll(): Array<Detection> {
        
    }

}
