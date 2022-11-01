import {useIsFocused} from '@react-navigation/native';
import * as React from 'react';

import {Dimensions, Platform, StyleSheet, Text, View} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {
  DBRConfig,
  decode,
  TextResult,
} from 'vision-camera-dynamsoft-barcode-reader';
import * as REA from 'react-native-reanimated';
import { Polygon, Text as SVGText, Svg, Rect } from 'react-native-svg';

const CameraQR = (): JSX.Element => {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [frameWidth, setFrameWidth] = React.useState(1280);
  const [frameHeight, setFrameHeight] = React.useState(720);
  const [barcodeResults, setBarcodeResults] = React.useState(
    [] as TextResult[],
  );
  const devices = useCameraDevices();
  const device = devices.back;
  const isActive = useIsFocused();

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const config: DBRConfig = {};
    config.template =
      '{"ImageParameter":{"BarcodeFormatIds":["BF_QR_CODE"],"Description":"","Name":"Settings"},"Version":"3.0"}'; //scan qrcode only

    const results: TextResult[] = decode(frame, config);
    REA.runOnJS(setBarcodeResults)(results);
  }, []);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const getPointsData = (tr: TextResult) => {
    var pointsData = tr.x1 + ',' + tr.y1 + ' ';
    pointsData = pointsData + tr.x2 + ',' + tr.y2 + ' ';
    pointsData = pointsData + tr.x3 + ',' + tr.y3 + ' ';
    pointsData = pointsData + tr.x4 + ',' + tr.y4;
    return pointsData;
  };

  const getViewBox = () => {
    const frameSize = getFrameSize();
    const viewBox = '0 0 ' + frameSize[0] + ' ' + frameSize[1];
    return viewBox;
  };

  const getFrameSize = (): number[] => {
    let width: number, height: number;
    if (Platform.OS === 'android') {
      if (
        frameWidth > frameHeight &&
        Dimensions.get('window').width > Dimensions.get('window').height
      ) {
        width = frameWidth;
        height = frameHeight;
      } else {
        console.log('Has rotation');
        width = frameHeight;
        height = frameWidth;
      }
    } else {
      width = frameWidth;
      height = frameHeight;
    }
    return [width, height];
  };

  return (
    <View style={{flex: 1}}>
      {device != null && hasPermission && (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
          />
          {barcodeResults.map((barcode, idx) => (
            <Text key={idx} style={styles.barcodeTextURL}>
              {barcode.barcodeText}
            </Text>
          ))}
        </>
      )}
      <Svg style={StyleSheet.absoluteFill} viewBox={getViewBox()}>
        {barcodeResults.map((barcode, idx) => (
          <Polygon
            key={'poly-' + idx}
            points={getPointsData(barcode)}
            fill="lime"
            stroke="green"
            opacity="0.5"
            strokeWidth="1"
          />
        ))}
        {barcodeResults.map((barcode, idx) => (
          <SVGText
            key={'text-' + idx}
            fill="white"
            stroke="purple"
            fontSize={(getFrameSize()[0] / 400) * 20}
            fontWeight="bold"
            x={barcode.x1}
            y={barcode.y1}>
            {barcode.barcodeText}
          </SVGText>
        ))}
      </Svg>
    </View>
  );
};

export default CameraQR;

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});
