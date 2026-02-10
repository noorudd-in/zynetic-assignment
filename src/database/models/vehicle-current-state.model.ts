import {
    Table,
    Column,
    Model,
    DataType
} from 'sequelize-typescript';

@Table({
    tableName: 'vehicle_current_state',
    timestamps: false,
})
export class VehicleCurrentState extends Model<VehicleCurrentState> {
    @Column({
        field: 'vehicle_id',
        type: DataType.STRING(64),
        primaryKey: true,
    })
    declare vehicleId: string;

    @Column({
        field: 'meter_id',
        type: DataType.STRING(64),
        allowNull: false,
    })
    meterId: string;

    @Column({
        field: 'last_kwh_delivered_dc',
        type: DataType.DECIMAL(10, 4),
        allowNull: false,
    })
    lastKwhDeliveredDc: number;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: true,
    })
    soc: number;

    @Column({
        field: 'battery_temp',
        type: DataType.DECIMAL(5, 2),
        allowNull: true,
    })
    batteryTemp: number;

    @Column({
        field: 'last_updated_at',
        type: DataType.DATE,
        allowNull: false,
    })
    lastUpdatedAt: Date;
}
