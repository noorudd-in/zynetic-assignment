import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectConnection()
        private readonly sequelize: Sequelize,
    ) { }

    async getVehiclePerformance(vehicleId: string) {
        const sql = `WITH vehicle_minutes AS (
            SELECT
              vr.vehicle_id,
              vr.meter_id,
              date_trunc('minute', vr.recorded_at) AS minute_ts,
              vr.kwh_delivered_dc,
              vr.soc,
              vr.battery_temp
            FROM vehicle_readings vr
            WHERE vr.vehicle_id = :vehicleId
              AND vr.recorded_at >= NOW() - INTERVAL '24 hours'
              AND NOT EXISTS (
                SELECT 1
                FROM vehicle_readings other
                WHERE other.meter_id = vr.meter_id
                  AND date_trunc('minute', other.recorded_at)
                      = date_trunc('minute', vr.recorded_at)
                  AND other.vehicle_id <> vr.vehicle_id
              )
          )
          
          SELECT
            v.vehicle_id,
            SUM(m.kwh_consumed_ac) AS total_ac_consumed,
            SUM(v.kwh_delivered_dc) AS total_dc_delivered,
            SUM(v.kwh_delivered_dc) / NULLIF(SUM(m.kwh_consumed_ac), 0) AS efficiency,
            AVG(v.soc) AS average_soc,
            AVG(v.battery_temp) AS average_battery_temp
          FROM vehicle_minutes v
          JOIN meter_readings m
            ON m.meter_id = v.meter_id
           AND date_trunc('minute', m.recorded_at) = v.minute_ts
          GROUP BY v.vehicle_id;
          `;

        const rows = await this.sequelize.query<any>(sql, {
            replacements: { vehicleId },
            type: 'SELECT' as any,
        });

        if (rows.length === 0) {
            return {
                vehicleId,
                message: 'No charging data found in last 24 hours',
            };
        }

        const r = rows[0];

        return {
            vehicleId,
            timeWindowHours: 24,
            totalAcConsumedKwh: Number(r.total_ac_consumed),
            totalDcDeliveredKwh: Number(r.total_dc_delivered),
            chargingEfficiency: Number(r.efficiency),
            averageSoc: Number(r.average_soc),
            averageBatteryTemp: Number(r.average_battery_temp),
        };
    }
}