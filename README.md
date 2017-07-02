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
Throws the alerts that the NOAA agency emits. They have usually 1 hour of potential impacts advanced prediction. Can be of any kind, like GPS satellite problems, HF radio signal drops, etc...

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
Streams data from around 20k weather stations around the globe.

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
            lon, lat
        }
        environment: {
            temp: "Temperature in Celsius",
            temp_min: "Minimum temperature",
            temp_max: "Maximum temperature",
            pressure: "Pressure in hPa",
            humidity: "Humidity in %",

            /* Optional */
            sea_level: "Pressure on the sea level",
            grnd_level: "Pressure on the ground level"
        },
        wind: {
            speed: "Wind speed in meter/sec",
            deg: "Wind direction in degrees"
        },
        rain_volume: "Rain volume",
        snow_volume: "Snow volume",
        clouds_coverage: "Cloud coverage in %"
    }
}
```

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