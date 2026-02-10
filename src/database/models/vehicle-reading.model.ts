import {
    Table,
    Column,
    Model,
    DataType,
    Index
} from 'sequelize-typescript';

export interface VehicleReadingAttributes {
    id?: number;
    vehicleId: string;
    meterId: string;
    kwhDeliveredDc: number;
    soc?: number;
    batteryTemp?: number;
    recordedAt: Date;
}

export interface VehicleReadingCreationAttributes
    extends Omit<VehicleReadingAttributes, 'id'> { }

@Table({
    tableName: 'vehicle_readings',
    timestamps: false
})
export class VehicleReading extends Model<
    VehicleReadingAttributes,
    VehicleReadingCreationAttributes> {
    @Column({
        type: DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;

    @Index
    @Column({
        field: 'vehicle_id',
        type: DataType.STRING(64),
        allowNull: false
    })
    vehicleId: string;

    @Index
    @Column({
        field: 'meter_id',
        type: DataType.STRING(64),
        allowNull: false
    })
    meterId: string;

    @Column({
        field: 'kwh_delivered_dc',
        type: DataType.DECIMAL(10, 4),
        allowNull: false
    })
    kwhDeliveredDc: number;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: true
    })
    soc: number;

    @Column({
        field: 'battery_temp',
        type: DataType.DECIMAL(5, 2),
        allowNull: true
    })
    batteryTemp: number;

    @Index
    @Column({
        field: 'recorded_at',
        type: DataType.DATE,
        allowNull: false
    })
    recordedAt: Date;
}
