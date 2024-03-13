// LocationCard.js
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Location from "expo-location";

const LocationCard = ({ setLocation }) => {
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      // 不设置 timeInterval 和 distanceInterval，或者将它们设置得很小
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 400,
          distanceInterval: 0.1,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          // console.log('New location update: ' + newLocation.coords.latitude + ', ' + newLocation.coords.longitude)
        }
      );

      return () => subscription.remove(); // 清理订阅
    })();
  }, []);

  return <View />;
};

export default LocationCard;