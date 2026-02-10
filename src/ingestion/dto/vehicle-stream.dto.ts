import {
    IsString,
    IsNumber,
    IsDateString,
    IsNotEmpty,
    Min,
    Max,
  } from 'class-validator';
  
  export class VehicleStreamDto {
    @IsString()
    @IsNotEmpty()
    vehicleId: string;
  
    @IsString()
    @IsNotEmpty()
    meterId: string;
  
    @IsNumber()
    @Min(0)
    @Max(100)
    soc: number;
  
    @IsNumber()
    kwhDeliveredDc: number;
  
    @IsNumber()
    batteryTemp: number;
  
    @IsDateString()
    timestamp: string;
  }
  