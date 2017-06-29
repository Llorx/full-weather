*Detailed info for the [full-weather](https://www.satori.com/channels/full-weather) channel at [Satori.com](https://www.satori.com/).*

## What's this?
This channel aggregates data from a lot of sources that could provide information about anything that can have a natural impact on the earth.

## Data types
Currently this channel streams `Space alerts`, `Atmospheric data`, `Space data`, `Hurricanes` and `Lightnings`. Working on `Earth severe alerts` and `Tornados`.

### Lightnings
Streams the latest strikes in real-time.

The signature is:

```javascript
{
    type: "lightning",
    location: {
        coords: {
            /* Lightning location */
            lon, lat, alt
        },
        polarity: "Lightning polarity: 1, -1",
        max_deviation_span_ns: "Deviation in nanoseconds",
        max_circular_gap: "Circular gap in degrees"
    }
}
```

### Space data
Streams space data that could potentially impact the earth coming from DSCOVR, ACE, GOES and POES satellites.

The signature is:

```javascript
{
    type: "space_data",
    data: {
        type: "Data type",
        location: "W135 or W076", /* Optional */

        [...]
        /* Different data depending on the type */
    }
}
```

The data types that can be received are:

- `magnetic_fields`. Without location. Properties: `bx, by, bz, lon, lat, bt`.
- `wind_plasma`. Properties: `density, speed, temperature`.
- `xray_flux`. Properties: `short, long`.
- `particle_electron_flux`. Properties: `particles_over_X_mev` (1, 5, 10, 30, 50, 100) `electrons_over_X_mev` (0_8, 2, 4).
- `energetic_proton_flux`. Properties: `protons_X_to_Y_mev` (0_7-4, 4-9, 9-15, 15-40, 38-82, 84-200, 110-900, 350-420, 420-510, 510-700) `protons_over_700_mev`.
- `geomagnetic_components`. Properties: `hp, he, hn, total`.
- `aurora_hemispheric_power`. Without location. Properties: `north, south`.

The impact that can have on earth are:
- [Climate](http://www.swpc.noaa.gov/impacts/space-weather-impacts-climate)
- [HF Radio communications](http://www.swpc.noaa.gov/impacts/hf-radio-communications) and [Radio blackouts](http://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts)
- [GPS systems](http://www.swpc.noaa.gov/impacts/space-weather-and-gps-systems)
- [Electric power transmission](http://www.swpc.noaa.gov/impacts/electric-power-transmission)
- [Satellite drag](http://www.swpc.noaa.gov/impacts/satellite-drag)
- [Satellite communications](http://www.swpc.noaa.gov/impacts/satellite-communications)

And the phenomenas are:
- [Aurora](http://www.swpc.noaa.gov/phenomena/aurora)
- [CM Radio emissions](http://www.swpc.noaa.gov/phenomena/f107-cm-radio-emissions)

### Space alert
Throws the alerts that the NOAA agency emits. They have usually 1 hour of potential impacts advanced prediction. Can be of any kind, like GPS satellite problems, FM radio signal drops, etc...

The signature is:

```javascript
{
    type: "space_alert",
    alert: {
        /* Always received */
        code: "Alert code",
        serial: "id",

        /* One of these */
        alert: "Alert type",
        warning: "Alert type",
        watch: "Alert type",
        cancel_watch: {
            watch: "Watch type",
            cancel_serial: "Cancelled id",
            original_time: "Original issued time"
        },
        continued_alert: {
            alert: "Alert type",
            continuation_serial: "Linked id",
            begin: "Date",
            prev_max_2mev_flux: "Yesterday Maximum 2MeV Flux"
        },
        extended_warning: {
            warning: "Warning type",
            extension_serial: "Linked id"
        },

        /* Optionals. Each one of this may appear or not depending on the type */
        begin: "date",
        threshold_reached: "Threshold Reached",
        valid: {
            from: "date",
            to: "date" /* or */ updated_to: "new date"
        }
        replace_prior_watches: "Boolean",
        warning_condition: "Condition",
        shock_passage: "IP Shock Passage Observed",
        summary: "text",
        observed: "date",
        deviation: "Deviation",
        station: "Station",
        synoptic_period: "Synoptic Period",
        estimated_velocity: "Estimated Velocity",
        has_warning: "Has active warning",
        highest_storm_level_by_day: "Array of highest storm level predicted by day",
        noaa_scale: "NOAA scale as for http://www.swpc.noaa.gov/noaa-scales-explanation",
        comment: "text",
        description: "text",
        impacts: "Array of potential impacts of this alert"
    }
}
```

### Atmospheric data
Streams data from around 40k weather stations around the globe with a centenar of different variables.

The signature is:

```javascript
{
    type: "atmospheric_data",
    data: {
        id: "Station unique ID",
        name: "Station name",
        timezone: "Station timezone",
        coords: {
            /* Station coords */
            lon, lat, alt
        }
        data: {
            /* Variables updated from this station */
        }
    }
}
```

The variables can be any of this list. Not all stations will have the same variables, as they depend on the station type:

Name | Description | Unit
--- | --- | ---
`air_temp` | Temperature | Celsius
`dew_point_temperature` | Dew Point | Celsius
`relative_humidity` | Relative Humidity | %
`wind_speed` | Wind Speed | m/s
`wind_direction` | Wind Direction | Degrees
`wind_gust` | Wind Gust | m/s
`altimeter` | Altimeter | Pascals
`pressure` | Pressure | Pascals
`snow_depth` | Snow depth | Millimeters
`solar_radiation` | Solar Radiation | W/m**2
`soil_temp` | Soil Temperature | Celsius
`precip_accum` | Precipitation accumulated | Millimeters
`precip_accum_one_minute` | Precipitation 1min | Millimeters
`precip_accum_ten_minute` | Precipitation 10min | Millimeters
`precip_accum_fifteen_minute` | Precipitation 15min | Millimeters
`precip_accum_30_minute` | Precipitation 30 min | Millimeters
`precip_accum_one_hour` | Precipitation 1hr | Millimeters
`precip_accum_three_hour` | Precipitation 3hr | Millimeters
`sea_level_pressure` | Sea level pressure | Pascals
`water_temp` | Water Temperature | Celsius
`weather_cond_code` | Weather conditions | code
`cloud_layer_3_code` | Cloud_layer_3 height/coverage | code
`cloud_low_symbol` | Low_cloud symbol | code
`cloud_mid_symbol` | Mid_cloud symbol | code
`cloud_high_symbol` | High_cloud symbol | code
`pressure_tendency` | Pressure Tendency | code
`snow_accum` | Snowfall | Millimeters
`precip_storm` | Precipitation storm | Millimeters
`road_sensor_num` | Road sensor number | 
`road_temp` | Road Temperature | Celsius
`road_freezing_temp` | Road_Freezing Temperature | Celsius
`road_surface_condition` | Road_Surface Conditions | code
`cloud_layer_1_code` | Cloud_layer_1 height/coverage | code
`cloud_layer_2_code` | Cloud_layer_2 height/coverage | code
`precip_accum_six_hour` | Precipitation 6hr | Millimeters
`precip_accum_24_hour` | Precipitation 24hr | Millimeters
`visibility` | Visibility | Statute miles
`sonic_wind_direction` | Sonic_Wind Direction | Degrees
`metar_remark` | Remarks | text
`metar` | Raw observation | text
`air_temp_high_6_hour` | 6 Hr High Temperature | Celsius
`air_temp_low_6_hour` | 6 Hr Low Temperature | Celsius
`peak_wind_speed` | Peak_Wind Speed | m/s
`fuel_temp` | Fuel Temperature | Celsius
`fuel_moisture` | Fuel Moisture | gm
`ceiling` | Ceiling | Meters
`sonic_wind_speed` | Sonic_Wind Speed | m/s
`pressure_change_code` | Pressure change | code
`precip_smoothed` | Precipitation smoothed | Millimeters
`soil_temp_ir` | IR_Soil Temperature | Celsius
`temp_in_case` | Temperature in_case | Celsius
`soil_moisture` | Soil Moisture | %
`volt` | Battery voltage | volts
`created_time_stamp` | Data Insert Date/Time | minutes
`last_modified` | Data Update Date/Time | minutes
`snow_smoothed` | Snow smoothed | Millimeters
`precip_manual` | Precipitation manual | Millimeters
`precip_accum_manual` | Precipitation 1hr manual | Millimeters
`precip_accum_5_minute_manual` | Precipitation 5min manual | Millimeters
`precip_accum_10_minute_manual` | Precipitation 10min manual | Millimeters
`precip_accum_15_minute_manual` | Precipitation 15min manual | Millimeters
`precip_accum_3_hour_manual` | Precipitation 3hr manual | Millimeters
`precip_accum_6_hour_manual` | Precipitation 6hr manual | Millimeters
`precip_accum_24_hour_manual` | Precipitation 24hr manual | Millimeters
`snow_accum_manual` | Snow manual | Millimeters
`snow_interval` | Snow interval | Millimeters
`road_subsurface_tmp` | Road Subsurface Temperature | Celsius
`T_water_temp` | Water Temperature | Celsius
`evapotranspiration` | Evapotranspiration | Millimeters
`snow_water_equiv` | Snow water equivalent | Millimeters
`precipitable_water_vapor` | Precipitable water vapor | Millimeters
`air_temp_high_24_hour` | 24 Hr High Temperature | Celsius
`air_temp_low_24_hour` | 24 Hr Low Temperature | Celsius
`peak_wind_direction` | Peak_Wind Direction | Degrees
`net_radiation` | Net Radiation | W/m**2
`soil_moisture_tension` | Soil Moisture tension | centibars
`pressure_1500_meter` | 1500 m Pressure | Pascals
`air_temp_wet_bulb` | Wet bulb temperature | Celsius
`air_temp_2m` | Air_Temperature at_2_meters | Celsius
`air_temp_10m` | Air_Temperature at_10_meters | Celsius
`surface_temp` | Surface Temperature | Celsius
`net_radiation_sw` | Net Shortwave Radiation | W/m**2
`net_radiation_lw` | Net Longwave Radiation | W/m**2
`sonic_air_temp` | Sonic Temperature | Celsius
`sonic_vertical_vel` | Vertical_Velocity | m/s
`sonic_zonal_wind_stdev` | Zonal_Wind Standard_Deviation | m/s
`sonic_vertical_wind_stdev` | Vertical_Wind Standard_Deviation | m/s
`sonic_air_temp_stdev` | Temperature Standard_Deviation | Centigrade
`vertical_heat_flux` | Vertical Heat_Flux | m/s C
`friction_velocity` | Friction Velocity | m/s
`w_ratio` | SIGW/USTR | nondimensional
`sonic_ob_count` | Sonic_Obs Total | nondimensional
`sonic_warn_count` | Sonic Warnings | nondimensional
`moisture_stdev` | Moisture Standard_Deviation | g/m**3
`vertical_moisture_flux` | Vertical Moisture_Flux | m/s g/m**3
`virtual_temp` | Virtual Temperature | Celsius
`geopotential_height` | Geopotential Height | Meters
`outgoing_radiation_sw` | Outgoing Shortwave Radiation | W/m**2
`PM_25_concentration` | PM_2.5 Concentration | ug/m3
`ozone_concentration` | Ozone Concentration | ppb
`precip_accum_since_7_local` | Precipitation since_7_AM local | Millimeters
`snow_accume_24_hour` | Snow 24hr | Millimeters
`snow_accum_since_7_local` | Snow since 7 AM local | Millimeters
`past_weather_code` | Past weather | code
`precip_accum_12_hour` | Precipitation 12hr | Millimeters
`surface_level` | Surface Level | Millimeters
`estimated_snowfall_rate` | Estimated Snowfall_Rate | Millimeters/hr
`incoming_radiation_lw` | Incoming Longwave Radiation | W/m**2
`outgoing_radiation_lw` | Outgoing Longwave Radiation | W/m**2
`permittivity` | Permittivity | 
`electric_conductivity` | Electric Conductivity | dS/m
`sensor_error_code` | Sensor Error Code | code
`precip_accum_five_minute` | Precipitation 5min | Millimeters
`precip_accum_since_00utc` | Precipitation_since 00_UTC | Millimeters
`gage_height` | Gage height | ft
`stream_flow` | Stream flow | ft3/s
`black_carbon_concentration` | Black Carbon Concentration | ug/m3
`precip_accum_since_local_midnight` | Precipitation_since local_midnight | Millimeters
`particulate_concentration` | Particulate Concentration | ug/m3
`filter_percentage` | Filter Percentage | %
`derived_aerosol_boundary_layer_depth` | Derived Aerosol Boundary Layer Depth | Meters
`wind_cardinal_direction` | Wind cardinal direction | 
`wet_bulb_temperature` | Wet bulb temperature | 
`wind_chill` | Wind chill | 
`heat_index` | Heat index | 
`weather_condition` | Weather condition | 

### Hurricanes
Streams the current hurricanes info, such as location, direction, speed, etc...

The signature is:

```javascript
{
    type: "hurricane",
    location: {
        name: "The storn name alogn with the hurricane type",
        coords: {
            /* Storm location */
            lon, lat
        },
        ss_category: "Saffir Simpson Category, in number",
        category: "Text Category",
        wind: {
            speed: "Wind speed",
            gust: "Wind gust",
            quadrants: "Wind quadrants",
            radius: "Wind radius"
        },
        speed: "Speed",
        direction: "Direction",
        pressure: "Pressure"
    }
}
```