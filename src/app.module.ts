import { Module } from '@nestjs/common';
import { IngestionModule } from './ingestion/ingestion.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [IngestionModule, DatabaseModule],
})
export class AppModule { }
