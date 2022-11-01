import {useIsFocused} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {
  DLRResult,
  recognize,
  ScanConfig,
  ScanRegion,
} from 'vision-camera-dynamsoft-label-recognizer';
import * as REA from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';

import {Label} from '../../components/Camera/Label';
import {myToast} from '../../utils/myToast';

const scanRegion: ScanRegion = {
  left: 5,
  top: 40,
  width: 90,
  height: 10,
};

const CameraLabel = () => {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back',
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [recognitionResults, setRecognitionResults] = React.useState(
    [] as DLRResult[],
  );
  const currentLabel = useSharedValue('');
  const isFace = useSharedValue('');

  const devices = useCameraDevices();
  const device = devices[cameraPosition];
  const isActive = useIsFocused();

  const supportsCameraFlipping = useMemo(
    () => devices.back != null && devices.front != null,
    [devices.back, devices.front],
  );

  const toggleFlip = useCallback(() => {
    if (cameraPosition === 'back') {
      setCameraPosition('front');
      return;
    }

    setCameraPosition('back');
  }, [cameraPosition]);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const config: ScanConfig = {};
    config.license = 'DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9';
    config.scanRegion = scanRegion;
    const result = recognize(frame, config);
    console.log('result: ', result);
    REA.runOnJS(setRecognitionResults)(result.results);
  }, []);

  // const getViewBox = () => {
  //   const frameSize = getFrameSize();
  //   const viewBox = '0 0 ' + frameSize.width + ' ' + frameSize.height;
  //   return viewBox;
  // };

  // const getFrameSize = (): {width: number; height: number} => {
  //   let width: number, height: number;
  //   if (HasRotation()) {
  //     //check whether the original frame is landscape. If so, switch height and width.
  //     width = frameHeight;
  //     height = frameWidth;
  //   } else {
  //     width = frameWidth;
  //     height = frameHeight;
  //   }
  //   return {width: width, height: height};
  // };

  // const HasRotation = () => {
  //   let value = false;
  //   if (Platform.OS === 'android') {
  //     if (
  //       !(
  //         frameWidth > frameHeight &&
  //         Dimensions.get('window').width > Dimensions.get('window').height
  //       )
  //     ) {
  //       value = true;
  //     }
  //   }
  //   return value;
  // };

  return (
    <View style={styles.container}>
      {device != null && hasPermission ? (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            frameProcessor={frameProcessor}
            frameProcessorFps={3}
          />
          {/* <Svg preserveAspectRatio='xMidYMid slice' style={StyleSheet.absoluteFill} viewBox={getViewBox()}>
            <Rect 
              x={scanRegion.left/100*getFrameSize().width}
              y={scanRegion.top/100*getFrameSize().height}
              width={scanRegion.width/100*getFrameSize().width}
              height={scanRegion.height/100*getFrameSize().height}
              strokeWidth="2"
              stroke="red"
            />
          </Svg> */}
          <View style={styles.content}>
            <View style={{alignItems: 'center'}}>
              <Label sharedValue={currentLabel} />
            </View>
            <View style={styles.actionSection}>
              {supportsCameraFlipping && (
                <TouchableOpacity
                  style={[styles.actionButton, {marginRight: 20}]}
                  onPress={toggleFlip}>
                  <Feather name="repeat" color="white" size={28} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => myToast(isFace.value)}>
                <Feather name="aperture" color="white" size={28} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <ActivityIndicator size="large" color="white" />
      )}
    </View>
  );
};

export default CameraLabel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  actionSection: {
    backgroundColor: 'rgba(21, 21, 21, 0.3)',
    height: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 14,
    padding: 8,
  },
});
