import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { MeterReading } from '../database/models/meter-reading.model';
import { VehicleReading } from '../database/models/vehicle-reading.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MeterReading,
      VehicleReading,
    ]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService]
})
export class IngestionModule { }
