// LocationCard.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

const LocationCard = ({ updateLocation }) => {
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      // 不设置 timeInterval 和 distanceInterval，或者将它们设置得很小
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // 使用最佳精度
          timeInterval: 400,
        },
        (newLocation) => {
          updateLocation(newLocation); // 使用父组件传递的函数更新位置信息
        }
      );

      return () => subscription.remove(); // 清理订阅
    })();
  }, [updateLocation]);

  return <View />;
};


export default LocationCard;
