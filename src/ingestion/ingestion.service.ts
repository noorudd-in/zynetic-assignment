import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MeterStreamDto } from './dto/meter-stream.dto';
import { VehicleStreamDto } from './dto/vehicle-stream.dto';
import { MeterReading } from '../database/models/meter-reading.model';
import { VehicleReading } from '../database/models/vehicle-reading.model';
import { MeterCurrentState } from '../database/models/meter-current-state.model';
import { VehicleCurrentState } from '../database/models/vehicle-current-state.model';

@Injectable()

export class IngestionService {
    constructor(
        @InjectModel(MeterReading)
        private readonly meterReadingModel: typeof MeterReading,

        @InjectModel(VehicleReading)
        private readonly vehicleReadingModel: typeof VehicleReading,

        @InjectConnection()
        private readonly sequelize: Sequelize,
    ) { }
    private isMeterStream(payload: any): boolean {
        return (
            payload.meterId &&
            payload.kwhConsumedAc !== undefined &&
            payload.vehicleId === undefined
        );
    }

    private isVehicleStream(payload: any): boolean {
        return (
            payload.vehicleId &&
            payload.kwhDeliveredDc !== undefined
        );
    }

    private validateMeterStream(payload: any): MeterStreamDto {
        const dto = plainToInstance(MeterStreamDto, payload);
        const errors = validateSync(dto);

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        return dto;
    }

    private validateVehicleStream(payload: any): VehicleStreamDto {
        const dto = plainToInstance(VehicleStreamDto, payload);
        const errors = validateSync(dto);

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        return dto;
    }

    private async insertMeterStream(dto: MeterStreamDto) {
        await this.meterReadingModel.create({
            meterId: dto.meterId,
            kwhConsumedAc: dto.kwhConsumedAc,
            voltage: dto.voltage,
            recordedAt: new Date(dto.timestamp),
        });

        const sql = `
          INSERT INTO meter_current_state (
            meter_id,
            last_kwh_consumed_ac,
            voltage,
            last_updated_at
          )
          VALUES (:meterId, :kwh, :voltage, :ts)
          ON CONFLICT (meter_id)
          DO UPDATE SET
            last_kwh_consumed_ac = EXCLUDED.last_kwh_consumed_ac,
            voltage = EXCLUDED.voltage,
            last_updated_at = EXCLUDED.last_updated_at
          WHERE meter_current_state.last_updated_at < EXCLUDED.last_updated_at;
        `;

        await this.sequelize.query(sql, {
            replacements: {
                meterId: dto.meterId,
                kwh: dto.kwhConsumedAc,
                voltage: dto.voltage,
                ts: new Date(dto.timestamp),
            },
        });
    }

    private async insertVehicleStream(dto: VehicleStreamDto) {
        await this.vehicleReadingModel.create({
            vehicleId: dto.vehicleId,
            meterId: dto.meterId,
            kwhDeliveredDc: dto.kwhDeliveredDc,
            soc: dto.soc,
            batteryTemp: dto.batteryTemp,
            recordedAt: new Date(dto.timestamp),
        });

        const sql = `
          INSERT INTO vehicle_current_state (
            vehicle_id,
            meter_id,
            last_kwh_delivered_dc,
            soc,
            battery_temp,
            last_updated_at
          )
          VALUES (:vehicleId, :meterId, :kwh, :soc, :temp, :ts)
          ON CONFLICT (vehicle_id)
          DO UPDATE SET
            meter_id = EXCLUDED.meter_id,
            last_kwh_delivered_dc = EXCLUDED.last_kwh_delivered_dc,
            soc = EXCLUDED.soc,
            battery_temp = EXCLUDED.battery_temp,
            last_updated_at = EXCLUDED.last_updated_at
          WHERE vehicle_current_state.last_updated_at < EXCLUDED.last_updated_at;
        `;

        await this.sequelize.query(sql, {
            replacements: {
                vehicleId: dto.vehicleId,
                meterId: dto.meterId,
                kwh: dto.kwhDeliveredDc,
                soc: dto.soc,
                temp: dto.batteryTemp,
                ts: new Date(dto.timestamp),
            },
        });
    }


    async handle(payload: any) {
        if (this.isMeterStream(payload)) {
            const dto = this.validateMeterStream(payload);
            await this.insertMeterStream(dto);
            return { message: 'Meter Stream Data Ingested', success: true };
        }

        if (this.isVehicleStream(payload)) {
            const dto = this.validateVehicleStream(payload);
            await this.insertVehicleStream(dto);
            return { message: 'Vehicle Stream Data Ingested', success: true };
        }

        throw new BadRequestException('Unknown stream type');
    }
}
