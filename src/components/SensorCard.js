// SensorCard.js
import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';

const sensors = {
  accelerometer: Accelerometer,
  gyroscope: Gyroscope,
  magnetometer: Magnetometer,
};

const SensorCard = ({ sensorName, updateSensorData }) => {
  useEffect(() => {
    const sensor = sensors[sensorName];
    if (!sensor) {
      console.error(`Sensor ${sensorName} is not supported.`);
      return;
    }

    const subscription = sensor.addListener(data => {
      updateSensorData(sensorName, data);
    });

    sensor.setUpdateInterval(500); // 设置更新间隔为 500 毫秒

    return () => subscription && subscription.remove();
  }, [sensorName, updateSensorData]);

  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
});

export default SensorCard;
