/* Cold Tables - Only for inserting rows */
CREATE TABLE IF NOT EXISTS meter_readings (
    id BIGSERIAL PRIMARY KEY,
    meter_id VARCHAR(64) NOT NULL,
    kwh_consumed_ac NUMERIC(10,4) NOT NULL,
    voltage NUMERIC(6,2),
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_readings (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id VARCHAR(64) NOT NULL,
    meter_id VARCHAR(64) NOT NULL,
    kwh_delivered_dc NUMERIC(10,4) NOT NULL,
    soc NUMERIC(5,2),
    battery_temp NUMERIC(5,2),
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_time
ON meter_readings (meter_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_vehicle_readings_vehicle_time
ON vehicle_readings (vehicle_id, recorded_at);

/* Hot tables - FOr upsert operations */

CREATE TABLE IF NOT EXISTS meter_current_state (
    meter_id VARCHAR(64) PRIMARY KEY,
    last_kwh_consumed_ac NUMERIC(10,4) NOT NULL,
    voltage NUMERIC(6,2),
    last_updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_current_state (
    vehicle_id VARCHAR(64) PRIMARY KEY,
    meter_id VARCHAR(64) NOT NULL,
    last_kwh_delivered_dc NUMERIC(10,4) NOT NULL,
    soc NUMERIC(5,2),
    battery_temp NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ NOT NULL
);
