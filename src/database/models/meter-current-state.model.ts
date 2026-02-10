import {
    Table,
    Column,
    Model,
    DataType
} from 'sequelize-typescript';

@Table({
    tableName: 'meter_current_state',
    timestamps: false,
})
export class MeterCurrentState extends Model<MeterCurrentState> {
    @Column({
        field: 'meter_id',
        type: DataType.STRING(64),
        primaryKey: true,
    })
    declare meterId: string;

    @Column({
        field: 'last_kwh_consumed_ac',
        type: DataType.DECIMAL(10, 4),
        allowNull: false,
    })
    lastKwhConsumedAc: number;

    @Column({
        type: DataType.DECIMAL(6, 2),
        allowNull: true,
    })
    voltage: number;

    @Column({
        field: 'last_updated_at',
        type: DataType.DATE,
        allowNull: false,
    })
    lastUpdatedAt: Date;
}
