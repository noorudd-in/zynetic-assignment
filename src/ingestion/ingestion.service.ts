import { Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MeterStreamDto } from './dto/meter-stream.dto';
import { VehicleStreamDto } from './dto/vehicle-stream.dto';

@Injectable()

export class IngestionService {
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

    handle(payload: any) {
        if (this.isMeterStream(payload)) {
            const dto = this.validateMeterStream(payload);
            return {
                type: 'meter',
                status: true,
                data: dto,
            };
        }

        if (this.isVehicleStream(payload)) {
            const dto = this.validateVehicleStream(payload);
            return {
                type: 'vehicle',
                status: true,
                data: dto,
            };
        }

        throw new BadRequestException('Unknown stream type');
    }
}
