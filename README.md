# Overview
This project implements a high-scale telemetry ingestion and analytics system for EV charging infrastructure. It ingests two independent telemetry streams data (grid-side smart meters and vehicle-side battery meter), stores both historical and current state, and computes per-vehicle charging efficiency over a rolling time window (24 hours in our case).

# Tech Stack
- Backend: NestJS
- Database: PostgreSQL
- ORM: Sequelize
- Containerization: Docker

# Assumptions
- There are 10,000+ Smart meters and vehicles
- These smart meters and vehicles emit stream data independely at roughly 1-minute intervals. It means if a Vehicle V1 is charging from Meter M1 then M1 might emit data at 10:05:11 and V1 might emit data at 10:05:45.
- While a vehicle is charging, it is associated with exactly one meter. A single meter can serve multiple vehicles, either concurrently, or sequentially over time. So we can assume At time T1, M1 may be associated with V1, At time T2, M1 may be associated with V2.
- Thus, we should always assume that the vehicle stream record must already know which meter it was using at that moment.

**NOTE:** Although the vehicle payload currently lacks a meterId, we are adding it explicitly to avoid unnecessary complexity. Processing millions of rows daily makes JOINs and mapping tables too slow for our requirements. By including the meterId directly in the vehicle payload, we eliminate these bottlenecks and ensure faster query performance.

# How can system handle 14.4 millions records daily?
To handle approximately 14.4 million telemetry records per day, the system uses a write-optimized ingestion path with append-only cold storage and constant-size hot storage for current state. Ingestion performs only validation and inserts, avoiding joins or correlation, which allows linear horizontal scaling. Historical telemetry is stored in time-indexed tables optimized for sequential writes and bounded range scans, while hot tables use timestamp-guarded UPSERTs to maintain correctness under concurrent and out-of-order updates. Analytics are decoupled from ingestion and operate on time-bounded queries with indexed access, ensuring high ingestion throughput while keeping analytical workloads predictable as data volume grows.

# Endpoints
To accept the Meter and Vehicle Stream data, we have two ways. We can either create two ingestion endpoints, one for vehicle stream data that validates and stores vehicle readings, and the other for smart meter stream data for meter readings. But since the assignment explicitly mentioned “Polymorphic Ingestion,” we will be creating only one endpoint that will accept both the telemetry data and store it.

`/v1/ingest` - This endpoint accepts both vehicle and meter readings, validates the DTOs, idendify the correct table and INSERT into the cold table or UPSERT into to the hot table respectively.

`/v1/analytics/performance/:vehicleId` - It will create buckets of vehicle telemetry stream data in 1-minute windows. Then it will keep only those minutes where no other vehicle used the same meter, so we can determine the vehicle–meter relationship. Next, we will join the meter AC data for those same minutes with the DC vehicle battery data. We aggregate AC, DC, SOC, and temperature, and then compute the efficiency. We do this for the last 24 hours to get the total result.

# Tables
`meter_readings` - Stores the grid meter reading. Since this is a cold storage, we are only INSERTING rows to preserve history.

`vehicle_readings` - Stores the vehicle battery meter readings. Since this is a cold storage, we are only INSERTING rows to preserve history.

`meter_current_state` - Stores current state of a grid meters. Since this a hot storage, we will be performing UPSERT operations.

`vehicle_current_state` - Stores current state of a battery meters. Since this a hot storage, we will be performing UPSERT operations.

# Input
I have tested with a small number of sample as mentioned below.
### Vehicle Readings
| id | vehicle_id | meter_id | kwh_delivered_dc |  soc  | battery_temp | recorded_at                  |
|----|------------|----------|------------------|-------|--------------|------------------------------|
| 1  | V1         | M1       | 0.4227           | 20.70 | 30.10        | 2026-02-10 14:47:24.841+00   |
| 2  | V1         | M1       | 0.4037           | 21.38 | 30.20        | 2026-02-10 14:48:24.843+00   |
| 3  | V1         | M1       | 0.4670           | 22.16 | 30.30        | 2026-02-10 14:49:24.843+00   |
| 4  | V1         | M1       | 0.5588           | 23.09 | 30.40        | 2026-02-10 14:50:24.843+00   |
| 5  | V1         | M1       | 0.5986           | 24.08 | 30.50        | 2026-02-10 14:51:24.843+00   |
| 6  | V2         | M1       | 0.5568           | 45.93 | 30.60        | 2026-02-10 14:52:24.843+00   |
| 7  | V2         | M1       | 0.4347           | 46.65 | 30.70        | 2026-02-10 14:53:24.843+00   |
| 8  | V2         | M1       | 0.5990           | 47.65 | 30.80        | 2026-02-10 14:54:24.843+00   |
| 9  | V2         | M1       | 0.4371           | 48.38 | 30.90        | 2026-02-10 14:55:24.843+00   |
| 10 | V2         | M1       | 0.5218           | 49.25 | 31.00        | 2026-02-10 14:56:24.843+00   |

### Smart Meter Readings
| id | meter_id | kwh_consumed_ac | voltage | recorded_at                  |
|----|----------|-----------------|---------|------------------------------|
| 1  | M1       | 0.4796          | 232.00  | 2026-02-10 14:47:24.841+00   |
| 2  | M1       | 0.4457          | 232.34  | 2026-02-10 14:48:24.843+00   |
| 3  | M1       | 0.5210          | 231.43  | 2026-02-10 14:49:24.843+00   |
| 4  | M1       | 0.6093          | 233.92  | 2026-02-10 14:50:24.843+00   |
| 5  | M1       | 0.6646          | 231.93  | 2026-02-10 14:51:24.843+00   |
| 6  | M1       | 0.6258          | 230.90  | 2026-02-10 14:52:24.843+00   |
| 7  | M1       | 0.4910          | 229.87  | 2026-02-10 14:53:24.843+00   |
| 8  | M1       | 0.6636          | 230.17  | 2026-02-10 14:54:24.843+00   |
| 9  | M1       | 0.4867          | 228.26  | 2026-02-10 14:55:24.843+00   |
| 10 | M1       | 0.5904          | 231.85  | 2026-02-10 14:56:24.843+00   |

# Output
Here is the ouptut calculated by our API Endpoints
### v1/analytics/performance/V1
```json
{
  "vehicleId": "V1",
  "timeWindowHours": 24,
  "totalAcConsumedKwh": 2.7202,
  "totalDcDeliveredKwh": 2.4508,
  "chargingEfficiency": 0.900963164473201,
  "averageSoc": 22.282,
  "averageBatteryTemp": 30.3
}
```

### v1/analytics/performance/V2
```json
{
  "vehicleId": "V2",
  "timeWindowHours": 24,
  "totalAcConsumedKwh": 2.8575,
  "totalDcDeliveredKwh": 2.5494,
  "chargingEfficiency": 0.892178477690289,
  "averageSoc": 47.572,
  "averageBatteryTemp": 30.8
}
```

### v1/analytics/performance/V3 - Error Scenario
```json
{
  "vehicleId": "V3",
  "message": "No charging data found in last 24 hours"
}
```