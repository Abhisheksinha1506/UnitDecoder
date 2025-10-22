#!/usr/bin/env node

/**
 * Comprehensive Vercel deployment setup script
 * Includes all 102+ units from the local database
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Vercel-specific database path
const DB_PATH = process.env.DB_PATH || '/tmp/unit_decoder.db';

console.log('🚀 Setting up comprehensive database for Vercel deployment...');
console.log(`📁 Database path: ${DB_PATH}`);

// Comprehensive units data (102+ units)
const comprehensiveUnits = [
  // Angle (3 units)
  { name: 'Degree', category: 'Angle', base_unit: 'Degree', conversion_factor: 1.0, description: 'Common unit of angle measurement, 1/360 of a circle', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Degree_(angle)' },
  { name: 'Gradian', category: 'Angle', base_unit: 'Degree', conversion_factor: 0.9, description: 'Unit of angle measurement, 1/400 of a circle', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Gradian' },
  { name: 'Radian', category: 'Angle', base_unit: 'Degree', conversion_factor: 57.2958, description: 'SI unit of angle measurement, based on radius', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Radian' },
  
  // Area (4 units)
  { name: 'Acre', category: 'Area', base_unit: 'Square Meter', conversion_factor: 4046.86, description: 'Traditional unit of area, originally the area a yoke of oxen could plow in a day', region: 'International', era: 'Historical', source_url: 'https://en.wikipedia.org/wiki/Acre' },
  { name: 'Hectare', category: 'Area', base_unit: 'Square Meter', conversion_factor: 10000.0, description: 'Metric unit of area, 100 meters by 100 meters', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Hectare' },
  { name: 'Rood', category: 'Area', base_unit: 'Square Meter', conversion_factor: 1011.714, description: 'Traditional English unit of area, quarter of an acre', region: 'United Kingdom', era: 'Historical', source_url: 'https://en.wikipedia.org/wiki/Rood_(unit)' },
  { name: 'Square Meter', category: 'Area', base_unit: 'Square Meter', conversion_factor: 1.0, description: 'Base unit of area in the metric system', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Square_metre' },
  
  // Counting (4 units)
  { name: 'Baker\'s Dozen', category: 'Counting', base_unit: 'Unit', conversion_factor: 13.0, description: 'A group of thirteen items, traditionally used by bakers', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Baker%27s_dozen' },
  { name: 'Dozen', category: 'Counting', base_unit: 'Unit', conversion_factor: 12.0, description: 'A group of twelve items', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Dozen' },
  { name: 'Gross', category: 'Counting', base_unit: 'Unit', conversion_factor: 144.0, description: 'A group of 144 items (12 dozen)', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Gross_(unit)' },
  { name: 'Score', category: 'Counting', base_unit: 'Unit', conversion_factor: 20.0, description: 'A group of twenty items', region: 'International', era: 'Historical', source_url: 'https://en.wikipedia.org/wiki/Score_(unit)' },
  
  // Currency (Historical) (3 units)
  { name: 'Ducat', category: 'Currency (Historical)', base_unit: 'Unit', conversion_factor: 1.0, description: 'Historical gold coin used in medieval Europe', region: 'Europe', era: 'Medieval', source_url: 'https://en.wikipedia.org/wiki/Ducat' },
  { name: 'Florin', category: 'Currency (Historical)', base_unit: 'Unit', conversion_factor: 1.0, description: 'Historical gold coin, predecessor to the ducat', region: 'Europe', era: 'Medieval', source_url: 'https://en.wikipedia.org/wiki/Florin' },
  { name: 'Guinea', category: 'Currency (Historical)', base_unit: 'Unit', conversion_factor: 1.0, description: 'Historical British gold coin, worth 21 shillings', region: 'United Kingdom', era: 'Historical', source_url: 'https://en.wikipedia.org/wiki/Guinea_(coin)' },
  
  // Data Storage (6 units)
  { name: 'Bit', category: 'Data Storage', base_unit: 'Bit', conversion_factor: 1.0, description: 'Base unit of digital information, binary digit', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Bit' },
  { name: 'Byte', category: 'Data Storage', base_unit: 'Bit', conversion_factor: 8.0, description: '8 bits, basic unit of digital storage', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Byte' },
  { name: 'Gigabyte', category: 'Data Storage', base_unit: 'Bit', conversion_factor: 8589934592.0, description: '1024 megabytes, digital storage unit', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Gigabyte' },
  { name: 'Kilobyte', category: 'Data Storage', base_unit: 'Bit', conversion_factor: 8192.0, description: '1024 bytes, digital storage unit', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilobyte' },
  { name: 'Megabyte', category: 'Data Storage', base_unit: 'Bit', conversion_factor: 8388608.0, description: '1024 kilobytes, digital storage unit', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Megabyte' },
  { name: 'Terabyte', category: 'Data Storage', base_unit: 'Bit', conversion_factor: 8796093022208.0, description: '1024 gigabytes, digital storage unit', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Terabyte' },
  
  // Electrical (4 units)
  { name: 'Ampere', category: 'Electrical', base_unit: 'Ampere', conversion_factor: 1.0, description: 'Base unit of electric current in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Ampere' },
  { name: 'Farad', category: 'Electrical', base_unit: 'Farad', conversion_factor: 1.0, description: 'Base unit of electrical capacitance in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Farad' },
  { name: 'Ohm', category: 'Electrical', base_unit: 'Ohm', conversion_factor: 1.0, description: 'Base unit of electrical resistance in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Ohm' },
  { name: 'Volt', category: 'Electrical', base_unit: 'Volt', conversion_factor: 1.0, description: 'Base unit of electric potential in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Volt' },
  
  // Energy (5 units)
  { name: 'BTU', category: 'Energy', base_unit: 'Joule', conversion_factor: 1055.06, description: 'British Thermal Unit, commonly used in heating and cooling', region: 'United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/British_thermal_unit' },
  { name: 'Calorie', category: 'Energy', base_unit: 'Joule', conversion_factor: 4.184, description: 'Unit of energy, commonly used in nutrition', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Calorie' },
  { name: 'Joule', category: 'Energy', base_unit: 'Joule', conversion_factor: 1.0, description: 'Base unit of energy in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Joule' },
  { name: 'Kilocalorie', category: 'Energy', base_unit: 'Joule', conversion_factor: 4184.0, description: '1000 calories, commonly used in food labeling', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilocalorie' },
  { name: 'Kilowatt Hour', category: 'Energy', base_unit: 'Joule', conversion_factor: 3600000.0, description: 'Unit of energy, commonly used for electricity billing', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilowatt_hour' },
  
  // Force (3 units)
  { name: 'Kilogram-force', category: 'Force', base_unit: 'Newton', conversion_factor: 9.80665, description: 'Metric unit of force, weight of 1 kilogram', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilogram-force' },
  { name: 'Newton', category: 'Force', base_unit: 'Newton', conversion_factor: 1.0, description: 'Base unit of force in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Newton_(unit)' },
  { name: 'Pound-force', category: 'Force', base_unit: 'Newton', conversion_factor: 4.44822, description: 'Imperial unit of force, commonly used in the US', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Pound_(force)' },
  
  // Frequency (4 units)
  { name: 'Gigahertz', category: 'Frequency', base_unit: 'Hertz', conversion_factor: 1000000000.0, description: '1,000,000,000 hertz, commonly used for modern processors', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Gigahertz' },
  { name: 'Hertz', category: 'Frequency', base_unit: 'Hertz', conversion_factor: 1.0, description: 'Base unit of frequency in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Hertz' },
  { name: 'Kilohertz', category: 'Frequency', base_unit: 'Hertz', conversion_factor: 1000.0, description: '1000 hertz, commonly used for radio frequencies', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilohertz' },
  { name: 'Megahertz', category: 'Frequency', base_unit: 'Hertz', conversion_factor: 1000000.0, description: '1,000,000 hertz, commonly used for computer processors', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Megahertz' },
  
  // Length (11 units)
  { name: 'Alen', category: 'Length', base_unit: 'Meter', conversion_factor: 0.6277, description: 'Traditional Scandinavian unit of length', region: 'Scandinavia', era: 'Traditional', source_url: 'https://en.wikipedia.org/wiki/Alen' },
  { name: 'Centimeter', category: 'Length', base_unit: 'Meter', conversion_factor: 0.01, description: 'One hundredth of a meter', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Centimetre' },
  { name: 'Cubit', category: 'Length', base_unit: 'Meter', conversion_factor: 0.4572, description: 'Traditional unit of length, used in Pacific cultures', region: 'Pacific Islands', era: 'Traditional', source_url: 'https://en.wikipedia.org/wiki/Cubit' },
  { name: 'Foot', category: 'Length', base_unit: 'Meter', conversion_factor: 0.3048, description: 'Imperial unit of length, 12 inches', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Foot_(unit)' },
  { name: 'Inch', category: 'Length', base_unit: 'Meter', conversion_factor: 0.0254, description: 'Imperial unit of length, 1/12 of a foot', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Inch' },
  { name: 'Kilometer', category: 'Length', base_unit: 'Meter', conversion_factor: 1000.0, description: '1000 meters', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilometre' },
  { name: 'Meter', category: 'Length', base_unit: 'Meter', conversion_factor: 1.0, description: 'Base unit of length in the metric system', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Meter' },
  { name: 'Mile', category: 'Length', base_unit: 'Meter', conversion_factor: 1609.34, description: 'Imperial unit of length, 5280 feet', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Mile' },
  { name: 'Millimeter', category: 'Length', base_unit: 'Meter', conversion_factor: 0.001, description: 'One thousandth of a meter', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Millimetre' },
  { name: 'Vara', category: 'Length', base_unit: 'Meter', conversion_factor: 0.8359, description: 'Traditional Spanish unit of length', region: 'Latin America', era: 'Colonial', source_url: 'https://en.wikipedia.org/wiki/Vara' },
  { name: 'Yard', category: 'Length', base_unit: 'Meter', conversion_factor: 0.9144, description: 'Imperial unit of length, 3 feet', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Yard' },
  
  // Mass (13 units)
  { name: 'Arroba', category: 'Mass', base_unit: 'Gram', conversion_factor: 11500.0, description: 'Traditional Spanish unit of weight, used in Brazil', region: 'Brazil', era: 'Colonial', source_url: 'https://en.wikipedia.org/wiki/Arroba' },
  { name: 'Dirham', category: 'Mass', base_unit: 'Gram', conversion_factor: 3.2, description: 'Traditional Arabic unit of weight', region: 'Middle East', era: 'Historical', source_url: 'https://en.wikipedia.org/wiki/Dirham' },
  { name: 'Gram', category: 'Mass', base_unit: 'Gram', conversion_factor: 1.0, description: 'Base unit of mass in the metric system', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Gram' },
  { name: 'Kilogram', category: 'Mass', base_unit: 'Gram', conversion_factor: 1000.0, description: '1000 grams, base unit of mass in SI', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilogram' },
  { name: 'Maund', category: 'Mass', base_unit: 'Gram', conversion_factor: 37324.0, description: 'Traditional unit of mass used in South Asia', region: 'South Asia', era: 'Traditional', source_url: 'https://en.wikipedia.org/wiki/Maund' },
  { name: 'Ounce', category: 'Mass', base_unit: 'Gram', conversion_factor: 28.3495, description: 'Imperial unit of mass, 1/16 of a pound', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Ounce' },
  { name: 'Pound', category: 'Mass', base_unit: 'Gram', conversion_factor: 453.592, description: 'Imperial unit of mass, 16 ounces', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Pound_(mass)' },
  { name: 'Quintal', category: 'Mass', base_unit: 'Gram', conversion_factor: 100000.0, description: 'Metric unit of mass, 100 kilograms', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Quintal' },
  { name: 'Stone', category: 'Mass', base_unit: 'Gram', conversion_factor: 6350.29, description: 'Imperial unit of mass, 14 pounds', region: 'United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Stone_(unit)' },
  { name: 'Tola', category: 'Mass', base_unit: 'Gram', conversion_factor: 11.6638038, description: 'Traditional unit of mass used in South Asia', region: 'South Asia', era: 'Traditional', source_url: 'https://en.wikipedia.org/wiki/Tola_(unit)' },
  { name: 'Ton', category: 'Mass', base_unit: 'Gram', conversion_factor: 1000000.0, description: 'Metric unit of mass, 1000 kilograms', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Ton' },
  { name: 'Tonne', category: 'Mass', base_unit: 'Gram', conversion_factor: 1000000.0, description: 'Metric unit of mass, 1000 kilograms (alternative spelling)', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Tonne' },
  { name: 'Troy Ounce', category: 'Mass', base_unit: 'Gram', conversion_factor: 31.1035, description: 'Unit of mass used for precious metals', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Troy_ounce' },
  
  // Power (3 units)
  { name: 'Horsepower', category: 'Power', base_unit: 'Watt', conversion_factor: 745.7, description: 'Unit of power, commonly used for engines', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Horsepower' },
  { name: 'Kilowatt', category: 'Power', base_unit: 'Watt', conversion_factor: 1000.0, description: '1000 watts, commonly used for electrical power', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilowatt' },
  { name: 'Watt', category: 'Power', base_unit: 'Watt', conversion_factor: 1.0, description: 'Base unit of power in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Watt' },
  
  // Pressure (5 units)
  { name: 'Atmosphere', category: 'Pressure', base_unit: 'Pascal', conversion_factor: 101325.0, description: 'Standard atmospheric pressure at sea level', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Atmosphere_(unit)' },
  { name: 'Bar', category: 'Pressure', base_unit: 'Pascal', conversion_factor: 100000.0, description: 'Unit of pressure, commonly used in meteorology', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Bar_(unit)' },
  { name: 'Millibar', category: 'Pressure', base_unit: 'Pascal', conversion_factor: 100.0, description: 'One thousandth of a bar, commonly used in weather', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Millibar' },
  { name: 'Pascal', category: 'Pressure', base_unit: 'Pascal', conversion_factor: 1.0, description: 'Base unit of pressure in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Pascal_(unit)' },
  { name: 'PSI', category: 'Pressure', base_unit: 'Pascal', conversion_factor: 6894.76, description: 'Pounds per square inch, commonly used in the US', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Pounds_per_square_inch' },
  
  // Speed (6 units)
  { name: 'Knot', category: 'Speed', base_unit: 'Meter per Second', conversion_factor: 0.514444, description: 'Unit of speed used in maritime and aviation', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Knot_(unit)' },
  { name: 'Meter per Second', category: 'Speed', base_unit: 'Meter per Second', conversion_factor: 1.0, description: 'Base unit of speed in the metric system', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Metre_per_second' },
  { name: 'Miles per Hour', category: 'Speed', base_unit: 'Meter per Second', conversion_factor: 0.44704, description: 'Imperial unit of speed, commonly used in the US', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Miles_per_hour' },
  { name: 'Kilometer per Hour', category: 'Speed', base_unit: 'Meter per Second', conversion_factor: 0.277778, description: 'Metric unit of speed, commonly used worldwide', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kilometres_per_hour' },
  { name: 'Foot per Second', category: 'Speed', base_unit: 'Meter per Second', conversion_factor: 0.3048, description: 'Imperial unit of speed', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Foot_per_second' },
  { name: 'Mach', category: 'Speed', base_unit: 'Meter per Second', conversion_factor: 343.0, description: 'Unit of speed relative to the speed of sound', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Mach_number' },
  
  // Temperature (4 units)
  { name: 'Celsius', category: 'Temperature', base_unit: 'Kelvin', conversion_factor: 1.0, description: 'Metric unit of temperature, commonly used worldwide', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Celsius' },
  { name: 'Fahrenheit', category: 'Temperature', base_unit: 'Kelvin', conversion_factor: 0.555556, description: 'Imperial unit of temperature, commonly used in the US', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Fahrenheit' },
  { name: 'Kelvin', category: 'Temperature', base_unit: 'Kelvin', conversion_factor: 1.0, description: 'Base unit of temperature in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Kelvin' },
  { name: 'Rankine', category: 'Temperature', base_unit: 'Kelvin', conversion_factor: 0.555556, description: 'Absolute temperature scale based on Fahrenheit', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Rankine_scale' },
  
  // Time (10 units)
  { name: 'Day', category: 'Time', base_unit: 'Second', conversion_factor: 86400.0, description: '24 hours, basic unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Day' },
  { name: 'Hour', category: 'Time', base_unit: 'Second', conversion_factor: 3600.0, description: '60 minutes, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Hour' },
  { name: 'Minute', category: 'Time', base_unit: 'Second', conversion_factor: 60.0, description: '60 seconds, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Minute' },
  { name: 'Month', category: 'Time', base_unit: 'Second', conversion_factor: 2629746.0, description: 'Approximate length of a month', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Month' },
  { name: 'Second', category: 'Time', base_unit: 'Second', conversion_factor: 1.0, description: 'Base unit of time in the International System of Units', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Second' },
  { name: 'Week', category: 'Time', base_unit: 'Second', conversion_factor: 604800.0, description: '7 days, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Week' },
  { name: 'Year', category: 'Time', base_unit: 'Second', conversion_factor: 31557600.0, description: '365.25 days, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Year' },
  { name: 'Decade', category: 'Time', base_unit: 'Second', conversion_factor: 315576000.0, description: '10 years, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Decade' },
  { name: 'Century', category: 'Time', base_unit: 'Second', conversion_factor: 3155760000.0, description: '100 years, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Century' },
  { name: 'Millennium', category: 'Time', base_unit: 'Second', conversion_factor: 31557600000.0, description: '1000 years, unit of time', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Millennium' },
  
  // Volume (14 units)
  { name: 'Cubic Meter', category: 'Volume', base_unit: 'Liter', conversion_factor: 1000.0, description: 'Base unit of volume in the metric system', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Cubic_metre' },
  { name: 'Cup', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.236588, description: 'Imperial unit of volume, commonly used in cooking', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Cup_(unit)' },
  { name: 'Fluid Ounce', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.0295735, description: 'Imperial unit of volume, commonly used in the US', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Fluid_ounce' },
  { name: 'Gallon', category: 'Volume', base_unit: 'Liter', conversion_factor: 3.78541, description: 'Imperial unit of volume, commonly used in the US', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Gallon' },
  { name: 'Liter', category: 'Volume', base_unit: 'Liter', conversion_factor: 1.0, description: 'Base unit of volume in the metric system', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Litre' },
  { name: 'Milliliter', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.001, description: 'One thousandth of a liter', region: 'International', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Millilitre' },
  { name: 'Pint', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.473176, description: 'Imperial unit of volume, 1/2 of a quart', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Pint' },
  { name: 'Quart', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.946353, description: 'Imperial unit of volume, 1/4 of a gallon', region: 'United States, United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Quart' },
  { name: 'Tablespoon', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.0147868, description: 'Imperial unit of volume, commonly used in cooking', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Tablespoon' },
  { name: 'Teaspoon', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.00492892, description: 'Imperial unit of volume, commonly used in cooking', region: 'United States', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Teaspoon' },
  { name: 'Imperial Gallon', category: 'Volume', base_unit: 'Liter', conversion_factor: 4.54609, description: 'British imperial unit of volume', region: 'United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Imperial_gallon' },
  { name: 'Imperial Pint', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.568261, description: 'British imperial unit of volume', region: 'United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Imperial_pint' },
  { name: 'Imperial Quart', category: 'Volume', base_unit: 'Liter', conversion_factor: 1.13652, description: 'British imperial unit of volume', region: 'United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Imperial_quart' },
  { name: 'Imperial Fluid Ounce', category: 'Volume', base_unit: 'Liter', conversion_factor: 0.0284131, description: 'British imperial unit of volume', region: 'United Kingdom', era: 'Modern', source_url: 'https://en.wikipedia.org/wiki/Imperial_fluid_ounce' }
];

// Aliases for better search coverage
const unitAliases = {
  'Meter': ['m', 'metre', 'meters', 'metres'],
  'Kilogram': ['kg', 'kilo', 'kilos'],
  'Gram': ['g', 'grams'],
  'Liter': ['l', 'litre', 'liters', 'litres'],
  'Centimeter': ['cm', 'centimetre', 'centimeters', 'centimetres'],
  'Kilometer': ['km', 'kilometre', 'kilometers', 'kilometres'],
  'Millimeter': ['mm', 'millimetre', 'millimeters', 'millimetres'],
  'Foot': ['ft', 'feet'],
  'Inch': ['in', 'inches'],
  'Mile': ['mi', 'miles'],
  'Yard': ['yd', 'yards'],
  'Pound': ['lb', 'lbs', 'pounds'],
  'Ounce': ['oz', 'ounces'],
  'Gallon': ['gal', 'gallons'],
  'Quart': ['qt', 'quarts'],
  'Pint': ['pt', 'pints'],
  'Cup': ['c', 'cups'],
  'Tablespoon': ['tbsp', 'tablespoons'],
  'Teaspoon': ['tsp', 'teaspoons'],
  'Fluid Ounce': ['fl oz', 'fluid ounces'],
  'Square Meter': ['sq m', 'm²', 'square metres'],
  'Cubic Meter': ['m³', 'cubic metres'],
  'Watt': ['W', 'watts'],
  'Kilowatt': ['kW', 'kilowatts'],
  'Horsepower': ['hp', 'horse power'],
  'Joule': ['J', 'joules'],
  'Calorie': ['cal', 'calories'],
  'Pascal': ['Pa', 'pascals'],
  'PSI': ['pounds per square inch'],
  'Hertz': ['Hz', 'hertz'],
  'Ampere': ['A', 'amp', 'amps', 'amperes'],
  'Volt': ['V', 'volts'],
  'Ohm': ['Ω', 'ohms'],
  'Newton': ['N', 'newtons'],
  'Degree': ['°', 'degrees'],
  'Radian': ['rad', 'radians'],
  'Second': ['s', 'sec', 'seconds'],
  'Minute': ['min', 'minutes'],
  'Hour': ['h', 'hr', 'hours'],
  'Day': ['d', 'days'],
  'Week': ['wk', 'weeks'],
  'Month': ['mo', 'months'],
  'Year': ['y', 'yr', 'years'],
  'Byte': ['B', 'bytes'],
  'Kilobyte': ['KB', 'kilobytes'],
  'Megabyte': ['MB', 'megabytes'],
  'Gigabyte': ['GB', 'gigabytes'],
  'Terabyte': ['TB', 'terabytes'],
  'Bit': ['b', 'bits'],
  'Dozen': ['dz', 'dozens'],
  'Gross': ['gr', 'grosses'],
  'Score': ['scores'],
  'Tola': ['tolas'],
  'Maund': ['maunds'],
  'Arroba': ['arrobas'],
  'Dirham': ['dirhams'],
  'Ducat': ['ducats'],
  'Florin': ['florins'],
  'Guinea': ['guineas'],
  'Acre': ['acres'],
  'Hectare': ['ha', 'hectares'],
  'Rood': ['roods'],
  'Alen': ['alens'],
  'Cubit': ['cubits'],
  'Vara': ['varas'],
  'Knot': ['kn', 'knots'],
  'Mach': ['mach'],
  'BTU': ['btu', 'British Thermal Unit'],
  'Celsius': ['°C', 'centigrade'],
  'Fahrenheit': ['°F'],
  'Kelvin': ['K', 'kelvins'],
  'Rankine': ['°R', 'rankine']
};

try {
  // Ensure directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize database
  const db = new Database(DB_PATH);
  
  // Configure SQLite for serverless environment
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000');
  db.pragma('temp_store = MEMORY');
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  try {
    db.exec(schema);
    console.log('✅ Database schema created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Database schema already exists');
    } else {
      throw error;
    }
  }
  
  // Check if we need to seed data
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get();
  
  if (unitCount.count === 0) {
    console.log('🌱 Seeding database with comprehensive unit data...');
    
    // Prepare statements for better performance
    const insertUnit = db.prepare(`
      INSERT INTO units (name, category, base_unit, conversion_factor, description, region, era, source_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertAlias = db.prepare(`
      INSERT INTO aliases (unit_id, alias, normalized_alias, phonetic_key)
      VALUES (?, ?, ?, ?)
    `);
    
    // Insert units in batches
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < comprehensiveUnits.length; i += batchSize) {
      const batch = comprehensiveUnits.slice(i, i + batchSize);
      
      // Start transaction for batch
      const insertBatch = db.transaction((units) => {
        for (const unit of units) {
          try {
            // Insert unit
            const unitResult = insertUnit.run(
              unit.name,
              unit.category,
              unit.base_unit,
              unit.conversion_factor,
              unit.description,
              unit.region,
              unit.era,
              unit.source_url,
              'verified'
            );
            
            const unitId = unitResult.lastInsertRowid;
            
            // Insert aliases for this unit
            const aliases = unitAliases[unit.name] || [];
            for (const alias of aliases) {
              const normalized = alias.toLowerCase().trim();
              const phonetic = require('natural').DoubleMetaphone.process(normalized);
              insertAlias.run(unitId, alias, normalized, phonetic);
            }
            
            // Always insert primary name as alias
            const primaryNormalized = unit.name.toLowerCase().trim();
            const primaryPhonetic = require('natural').DoubleMetaphone.process(primaryNormalized);
            insertAlias.run(unitId, unit.name, primaryNormalized, primaryPhonetic);
            
            insertedCount++;
            
          } catch (error) {
            console.error(`❌ Error inserting unit "${unit.name}":`, error.message);
          }
        }
      });
      
      // Execute batch
      insertBatch(batch);
      
      console.log(`📝 Processed ${insertedCount}/${comprehensiveUnits.length} units...`);
    }
    
    console.log('✅ Database seeded with comprehensive units');
    console.log(`📊 Total units inserted: ${insertedCount}`);
    
  } else {
    console.log(`✅ Database already contains ${unitCount.count} units`);
  }
  
  // Verify the data
  const finalCount = db.prepare('SELECT COUNT(*) as count FROM units').get();
  const aliasCount = db.prepare('SELECT COUNT(*) as count FROM aliases').get();
  
  console.log(`📊 Final database stats:`);
  console.log(`   Units: ${finalCount.count}`);
  console.log(`   Aliases: ${aliasCount.count}`);
  
  db.close();
  
  // Ensure public directory exists for Vercel
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    console.log('📁 Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  console.log('🎉 Comprehensive Vercel setup completed successfully!');
  
} catch (error) {
  console.error('❌ Error setting up database:', error.message);
  process.exit(1);
}
