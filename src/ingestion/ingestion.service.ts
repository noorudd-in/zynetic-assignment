import { Injectable } from '@nestjs/common';

@Injectable()
export class IngestionService {
  handle(payload: any) {
    return { status: 'received', payload };
  }
}
