// JavaScript code for the TI SensorTag Demo app.

/**
 * Object that holds application data and functions.
 */
var app = {};

/**
 * Data that is displayed in table
 */
app.tableData = [
		{ sensorName: 'x-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'y-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'z-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'total-accel', currentValue: 0, maxValue: 0}
        ];

/**
 * Timeout (ms) after which a message is shown if the SensorTag wasn't found.
 */
app.CONNECT_TIMEOUT = 3000;

/**
 * Object that holds SensorTag UUIDs.
 */
app.sensortag = {};

// UUIDs for movement services and characteristics.
app.sensortag.MOVEMENT_SERVICE = 'f000aa80-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_DATA = 'f000aa81-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_CONFIG = 'f000aa82-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_PERIOD = 'f000aa83-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb';

app.sensortag.KEYPRESS_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
app.sensortag.KEYPRESS_DATA = '0000ffe1-0000-1000-8000-00805f9b34fb';
app.sensortag.KEYPRESS_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb';

/**
 * Initialise the application.
 */
app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);
};

app.onDeviceReady = function()
{
	app.showInfo('Activate the SensorTag and tap Start.');
};

app.showInfo = function(info)
{
	//change this TODO
	document.getElementById('info').innerHTML = info;
	//console.log(info);
};

app.startSensorTag = function()
{
	app.stopSensorTag();
	app.startScan();
	app.showInfo('Status: Scanning...');
	app.startConnectTimer();
}

app.stopSensorTag = function()
{
	// Stop any ongoing scan and close devices.
	app.stopConnectTimer();
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();
	app.showInfo('Status: Stopped.');
}

app.startConnectTimer = function()
{
	// If connection is not made within the timeout
	// period, an error message is shown.
	app.connectTimer = setTimeout(
		function()
		{
			app.showInfo('Status: Scanning... ' +
				'Please press the activate button on the tag.');
		},
		app.CONNECT_TIMEOUT)
}

app.stopConnectTimer = function()
{
	clearTimeout(app.connectTimer);
}

app.startScan = function()
{
	evothings.easyble.startScan(
		function(device)
		{
			// Connect if we have found a sensor tag.
			if (app.deviceIsSensorTag(device))
			{
				app.showInfo('Status: Device found: ' + device.name + '.');
				evothings.easyble.stopScan();
				app.connectToDevice(device);
				app.stopConnectTimer();
			}
		},
		function(errorCode)
		{
			app.showInfo('Error: startScan: ' + errorCode + '.');
		});
};

app.deviceIsSensorTag = function(device)
{
	console.log('device name: ' + device.name);
	return (device != null) &&
		(device.name != null) &&
		(device.name.indexOf('Sensor Tag') > -1 ||
			device.name.indexOf('SensorTag') > -1);
};

/**
 * Read services for a device.
 */
app.connectToDevice = function(device)
{
	app.showInfo('Connecting...');
	device.connect(
		function(device)
		{
			app.showInfo('Status: Connected - reading SensorTag services...');
			app.readServices(device);
		},
		function(errorCode)
		{
			app.showInfo('Error: Connection failed: ' + errorCode + '.');
			evothings.ble.reset();
			// This can cause an infinite loop...
			//app.connectToDevice(device);
		});
};

app.readServices = function(device)
{
	device.readServices(
		[
		app.sensortag.MOVEMENT_SERVICE, // Movement service UUID.
		app.sensortag.KEYPRESS_SERVICE
		],
		// Function that monitors accelerometer data.
		app.startAccelerometerNotification,
		function(errorCode)
		{
			console.log('Error: Failed to read services: ' + errorCode + '.');
		});
};

app.success = function()
{
	console.log('Status: writeCharacteristic ok.');
}

app.fail = function(errorCode)
{
	console.log('Error: writeCharacteristic: ' + errorCode + '.');
}

/**
 * Read accelerometer data.
 */
app.startAccelerometerNotification = function(device)
{
	app.showInfo('Status: Starting accelerometer notification...');

	// Set accelerometer configuration to ON.
	// magnetometer on: 64 (1000000) (seems to not work in ST2 FW 0.89)
	// 3-axis acc. on: 56 (0111000)
	// 3-axis gyro on: 7 (0000111)
	// 3-axis acc. + 3-axis gyro on: 63 (0111111)
	// 3-axis acc. + 3-axis gyro + magnetometer on: 127 (1111111)
	device.writeCharacteristic(
		app.sensortag.MOVEMENT_CONFIG,
		new Uint8Array([56,3]),
		app.success,
		app.fail);

	// Set accelerometer period to 100 ms.
	device.writeCharacteristic(
		app.sensortag.MOVEMENT_PERIOD,
		new Uint8Array([10]),
		app.success,
		app.fail);

	// Set accelerometer notification to ON.
	device.writeDescriptor(
		app.sensortag.MOVEMENT_DATA,
		app.sensortag.MOVEMENT_NOTIFICATION, // Notification descriptor.
		new Uint8Array([1,0]),
		app.success,
		app.fail);

	// Start accelerometer notification.
	device.enableNotification(
		app.sensortag.MOVEMENT_DATA,
		function(data)
		{
			app.showInfo('Status: Data stream active - accelerometer');
			var dataArray = new Uint8Array(data);
			var values = app.getAccelerometerValues(dataArray);
			app.updateMapAccel(values);
		},
		function(errorCode)
		{
			console.log('Error: enableNotification: ' + errorCode + '.');
		});

//button

	// Set button notification to ON.
	device.writeDescriptor(
		app.sensortag.KEYPRESS_DATA,
		app.sensortag.KEYPRESS_NOTIFICATION, // Notification descriptor.
		new Uint8Array([1,0]),
		app.success,
		app.fail);

	// Start button notification.
	device.enableNotification(
		app.sensortag.KEYPRESS_DATA,
		function(data)
		{
			var dataArray = new Uint8Array(data);
			app.keyPressHandler(dataArray);
		},
		app.fail);
};

/**
 * Calculate accelerometer values from raw data for SensorTag 2.
 * @param data - an Uint8Array.
 * @return Object with fields: x, y, z.
 */
app.getAccelerometerValues = function(data)
{
	var divisors = { x: -16384.0, y: 16384.0, z: -16384.0 };

	// Calculate accelerometer values.
	var ax = evothings.util.littleEndianToInt16(data, 6) / divisors.x;
	var ay = evothings.util.littleEndianToInt16(data, 8) / divisors.y;
	var az = evothings.util.littleEndianToInt16(data, 10) / divisors.z;

	// Return result.
	return { x: ax, y: ay, z: az };
};

app.updateMapAccel = function(values) {
	app.tableData[0]['currentValue'] = values.x.toFixed(4) * 8;
	app.tableData[1]['currentValue'] = values.y.toFixed(4) * 8;
	app.tableData[2]['currentValue'] = values.z.toFixed(4) * 8;
	app.tableData[3]['currentValue'] = app.calculateTotalAccel(values).toFixed(4) * 8;

	if (app.tableData[0]['maxValue'] <= Math.abs(values.x * 8))
	{
		app.tableData[0]['maxValue'] = Math.abs(values.x.toFixed(4) * 8);
	}
	if (app.tableData[1]['maxValue'] <= Math.abs(values.y * 8))
	{
		app.tableData[1]['maxValue'] = Math.abs(values.y.toFixed(4) * 8);
	}
	if (app.tableData[2]['maxValue'] <= Math.abs(values.z * 8))
	{
		app.tableData[2]['maxValue'] = Math.abs(values.z.toFixed(4) * 8);
	}
	if (app.tableData[3]['maxValue'] <= app.calculateTotalAccel(values) * 8)
	{
		app.tableData[3]['maxValue'] = app.calculateTotalAccel(values).toFixed(4) * 8;
	}
	//averages
};

app.calculateTotalAccel = function(vectorArray)
{
	return Math.sqrt(Math.pow(vectorArray.x, 2) + Math.pow(vectorArray.y, 2) + Math.pow(vectorArray.z, 2));
};

app.keyPressHandler = function(values)
{
	if (values[0] == 3)
	{
		app.resetData();
	}
};

app.resetData = function()
{
	app.tableData[0]['currentValue'] = 0;
	app.tableData[1]['currentValue'] = 0;
	app.tableData[2]['currentValue'] = 0;
	app.tableData[3]['currentValue'] = 0;
	app.tableData[0]['maxValue'] = 0;
	app.tableData[1]['maxValue'] = 0;
	app.tableData[2]['maxValue'] = 0;
	app.tableData[3]['maxValue'] = 0;
};

app.getFeatureVector = function()
{
	var featureVector = [];

	featureVector.push(app.tableData[0]['maxValue']);
	featureVector.push(app.tableData[1]['maxValue']);
	featureVector.push(app.tableData[2]['maxValue']);
	featureVector.push(app.tableData[3]['maxValue']);

	return featureVector;
}

//remove this
app.onStartButton = function()
{
	app.startSensorTag();
};

app.onStopButton = function()
{
	app.stopSensorTag();
};

app.onResetButton = function()
{
	app.resetData();
};

app.onLogButton = function()
{
	var array = app.getFeatureVector();

	var string = array.join();

	app.showInfo(string);
};

// Initialize the app.
app.initialize();
