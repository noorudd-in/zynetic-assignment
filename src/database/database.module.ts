import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MeterReading } from './models/meter-reading.model';
import { VehicleReading } from './models/vehicle-reading.model';
import { MeterCurrentState } from './models/meter-current-state.model';
import { VehicleCurrentState } from './models/vehicle-current-state.model';

@Module({
    imports: [
        SequelizeModule.forRoot({
            dialect: 'postgres',
            host: 'localhost',
            port: 5433,
            username: 'zynetic_admin',
            password: 'zynetic_pass',
            database: 'zynetic_db',
            autoLoadModels: true,
            synchronize: false,
            logging: false,
        }),
        SequelizeModule.forFeature([MeterReading, VehicleReading, MeterCurrentState, VehicleCurrentState]),
    ],
})
export class DatabaseModule implements OnModuleInit {
    constructor(private readonly sequelize: Sequelize) { }

    async onModuleInit() {
        try {
            await this.sequelize.authenticate();
            console.log('PostgreSQL conected');
        } catch (error) {
            console.error('Database cnnecttion failed!', error);
        }
    }
}
