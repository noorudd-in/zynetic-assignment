import { Controller, Post, Body } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('v1/ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  ingest(@Body() payload: any) {
    return this.ingestionService.handle(payload);
  }
}