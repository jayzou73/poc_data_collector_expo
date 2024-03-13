import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Device from "expo-device";
import LocationCard from "./src/components/LocationCard";
import SensorCard from "./src/components/SensorCard";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
// import 'react-native-get-random-values';
// import { v4 as uuidv4 } from 'uuid';

// let uuid = uuidv4();
const App = () => {
  const [location, setLocation] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [activityType, setActivityType] = useState("1"); // 默认为 "Walk"
  const [deviceId, setDeviceId] = useState("");
  const [recordingInterval, setRecordingInterval] = useState(null);

  const fileUri = `${FileSystem.documentDirectory}${deviceId}.json`;

  const storeData = async (data) => {
    try {
      const existingData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const newData = JSON.parse(existingData);
      newData.push(data);
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newData), {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (e) {
      // 如果文件不存在，就创建一个新文件
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify([data]), {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  };

  // 开始记录数据
  const startRecording = () => {
    setIsRecording(true);

    // 假设 updateSensorData 已经被 SensorCard 正确设置，以便在传感器数据变化时更新传感器状态
    // 因此，只需要设置一个定时器，定期存储当前的状态数据即可
    const interval = setInterval(async () => {
      const timestamp = new Date().toISOString();
      const dataToStore = {
        ...getCurrentLocation(), // 直接使用 LocationCard 更新的位置状态
        sensorData: getCurrentSensorData(), // 由 SensorCard 通过 updateSensorData 更新的传感器数据
        activityType: getCurrentActivityType(),
        deviceId,
        timestamp,
      };
      await storeData(dataToStore);
    }, 1000); // 每 1000 毫秒存储一次数据
    setRecordingInterval(interval);
  };

  const locationRef = useRef(location);
  const sensorDataRef = useRef(sensorData);
  const activityTypeRef = useRef(activityType);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    sensorDataRef.current = sensorData;
  }, [sensorData]);

  useEffect(() => {
    activityTypeRef.current = activityType;
  }, [activityType]);

  const getCurrentLocation = () => locationRef.current;
  const getCurrentSensorData = () => sensorDataRef.current;
  const getCurrentActivityType = () => activityTypeRef.current;

  // 停止记录，并读取文件内容
  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(recordingInterval);
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      //   console.log(location)
      console.log("Stop recording, data loaded:", fileContent);
      console.log("Data saved in file:", fileUri);
    } catch (error) {
      console.error("Failed to read data", error);
    }
  };

  const shareRecording = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri).catch((error) => {
        console.error("Sharing error:", error);
        Alert.alert("Error", "Failed to share recording.");
      });
    } else {
      Alert.alert("Unavailable", "Sharing is not available on this device.");
    }
  };

  const showConfirmationDialog = () => {
    Alert.alert(
      "Confirm Clear", // Dialog title
      "Are you sure you want to clear the collected dataset?", // Dialog message
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel action"),
          style: "cancel",
        },
        { text: "Confirm", onPress: () => resetDataset() }, // Confirm action
      ],
      { cancelable: false } // Prevents the dialog from closing when touching outside
    );
  };

  const resetDataset = async () => {
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify([]), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  };

  useEffect(() => {
    // 使用 expo-device 获取设备ID
    setDeviceId(Device.osBuildId); // expo-device 不直接提供 getUniqueId，这里用 osBuildId 作为示例
  }, []);

  //   const updateLocation = (newLocation) => {
  //     setLocation(newLocation.coords);
  //   };

  const updateSensorData = (sensorName, data) => {
    setSensorData((currentData) => ({ ...currentData, [sensorName]: data }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.deviceID}>Device ID: {deviceId}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={activityType}
          onValueChange={(itemValue) => {
            if (!isRecording) {
              setActivityType(itemValue);
            } else {
              Alert.alert("Stop recording first!");
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Walk" value="1" />
          <Picker.Item label="Run" value="2" />
          <Picker.Item label="Bike" value="3" />
          <Picker.Item label="Car" value="4" />
          <Picker.Item label="Bus" value="5" />
          <Picker.Item label="Metro" value="6" />
        </Picker>
      </View>
      <View style={styles.buttons}>
        <Button
          title="Record"
          onPress={startRecording}
          color="green"
          disabled={isRecording}
        />
        <Button
          title="Stop"
          onPress={stopRecording}
          color="red"
          disabled={!isRecording}
        />
        <Button
          title="Share"
          onPress={shareRecording}
          color="blue"
          disabled={isRecording}
        />
      </View>
      <Text style={styles.status}>
        Status: {isRecording ? "Recording..." : "Not Recording"}
      </Text>
      <LocationCard
        setLocation={setLocation} // 传递样式
      />
      {location && (
        <Text>
          Location: Latitude {location.latitude}, Longitude {location.longitude}
        </Text>
      )}
      <SensorCard
        sensorName="accelerometer"
        updateSensorData={updateSensorData}
      />
      <SensorCard sensorName="gyroscope" updateSensorData={updateSensorData} />
      <SensorCard
        sensorName="magnetometer"
        updateSensorData={updateSensorData}
      />
      {Object.entries(sensorData).map(([key, value]) => (
        <View style={styles.sensorDataContainer} key={key}>
          <Text style={styles.sensorDataText}>
            {key}: x {value.x.toFixed(3)}, y {value.y.toFixed(3)}, z{" "}
            {value.z.toFixed(3)}
          </Text>
        </View>
      ))}
      <View>
        <Button
          title="Clean Collected Dataset"
          onPress={showConfirmationDialog}
          color="red"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff", // 添加背景色以提高可读性
  },
  deviceID: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16, // 调整字体大小以提高可读性
    padding: 10, // 添加内边距以避免文本紧贴边缘
  },
  pickerContainer: {
    marginBottom: 20,
    borderWidth: 1, // 添加边框以突出显示 Picker
    borderColor: "#ddd", // 使用柔和的边框颜色
    borderRadius: 5, // 轻微圆角以符合现代 UI 设计
  },
  picker: {
    width: "100%",
    height: 50,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 50,
    marginTop: 150,
  },
  buttonText: {
    color: "#fff", // 设置按钮文本颜色为白色
    textAlign: "center", // 按钮文本居中
  },
  recordingStatus: {
    fontSize: 18,
    color: "red",
    margin: 10,
    textAlign: "center",
  },
  locationCardStyle: {
    // 定义 LocationCard 的样式
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f0f0f0", // 仅示例，根据需要调整
    borderRadius: 10,
    margin: 10,
  },
  sensorDataContainer: {
    marginBottom: 20, // 为传感器数据添加底部间隔
  },
  sensorDataText: {
    fontSize: 14, // 调整传感器数据字体大小
    padding: 5, // 为传感器数据添加内边距
    borderWidth: 1, // 为传感器数据添加边框
    borderColor: "#ddd", // 使用柔和的边框颜色
    borderRadius: 5, // 轻微圆角
    marginBottom: 5, // 添加间隔以避免文本紧贴
  },
});

export default App;