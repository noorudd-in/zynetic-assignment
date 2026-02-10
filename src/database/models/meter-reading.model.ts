import {
    Table,
    Column,
    Model,
    DataType,
    Index,
} from 'sequelize-typescript';

export interface MeterReadingAttributes {
    id?: number;
    meterId: string;
    kwhConsumedAc: number;
    voltage?: number;
    recordedAt: Date;
}

export interface MeterReadingCreationAttributes
    extends Omit<MeterReadingAttributes, 'id'> { }

@Table({
    tableName: 'meter_readings',
    timestamps: false,
})
export class MeterReading extends Model<
    MeterReadingAttributes,
    MeterReadingCreationAttributes> {
    @Column({
        type: DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Index
    @Column({
        field: 'meter_id',
        type: DataType.STRING(64),
        allowNull: false,
    })
    meterId: string;

    @Column({
        field: 'kwh_consumed_ac',
        type: DataType.DECIMAL(10, 4),
        allowNull: false,
    })
    kwhConsumedAc: number;

    @Column({
        type: DataType.DECIMAL(6, 2),
        allowNull: true,
    })
    voltage: number;

    @Index
    @Column({
        field: 'recorded_at',
        type: DataType.DATE,
        allowNull: false,
    })
    recordedAt: Date;
}
