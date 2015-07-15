// JavaScript code for the TI SensorTag Demo app.

/**
 * Object that holds application data and functions.
 */
var app = {};

/**
 * Data that is plotted on the canvas.
 */
app.dataPoints = [];

/**
 * Data that is displayed in table
 */
app.tableData = [
		{ sensorName: 'x-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'y-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'z-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'total-accel', currentValue: 0, maxValue: 0},
        { sensorName: 'broken', currentValue: 0, maxValue: 0}/*,
		{ sensorName: 'temp-humidity', currentValue: 0, maxValue: 0},
        { sensorName: 'rel-humidity', currentValue: 0, maxValue: 0},
        { sensorName: 'amb-temp', currentValue: 0, maxValue: 0}*/
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
app.sensortag.KEYPRESS_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb'
app.sensortag.KEYPRESS_DATA = '0000ffe1-0000-1000-8000-00805f9b34fb'
app.sensortag.KEYPRESS_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb'

app.sensortag.TEMPERATURE_SERVICE = 'f000aa00-0451-4000-b000-000000000000'
app.sensortag.TEMPERATURE_DATA = 'f000aa01-0451-4000-b000-000000000000'
app.sensortag.TEMPERATURE_CONFIG = 'f000aa02-0451-4000-b000-000000000000'
app.sensortag.TEMPERATURE_PERIOD = 'f000aa03-0451-4000-b000-000000000000'
app.sensortag.TEMPERATURE_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb'

app.sensortag.HUMIDITY_SERVICE = 'f000aa20-0451-4000-b000-000000000000'
app.sensortag.HUMIDITY_DATA = 'f000aa21-0451-4000-b000-000000000000'
app.sensortag.HUMIDITY_CONFIG = 'f000aa22-0451-4000-b000-000000000000'
app.sensortag.HUMIDITY_PERIOD = 'f000aa23-0451-4000-b000-000000000000'
app.sensortag.HUMIDITY_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb'

app.sensortag.BAROMETER_SERVICE = 'f000aa40-0451-4000-b000-000000000000'
app.sensortag.BAROMETER_DATA = 'f000aa41-0451-4000-b000-000000000000'
app.sensortag.BAROMETER_CONFIG = 'f000aa42-0451-4000-b000-000000000000'
app.sensortag.BAROMETER_CALIBRATION = 'f000aa43-0451-4000-b000-000000000000'
app.sensortag.BAROMETER_PERIOD = 'f000aa44-0451-4000-b000-000000000000'
app.sensortag.BAROMETER_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb'

/**
 * Initialise the application.
 */
app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);

	// Called when HTML page has been loaded.
	$(document).ready( function()
	{
		// Adjust canvas size when browser resizes
		$(window).resize(app.respondCanvas);

		// Adjust the canvas size when the document has loaded.
		app.respondCanvas();
	});
};

/**
 * Adjust the canvas dimensions based on its container's dimensions.
 */
app.respondCanvas = function()
{
	var canvas = $('#canvas')
	var container = $(canvas).parent()
	canvas.attr('width', $(container).width() ) // Max width
	// Not used: canvas.attr('height', $(container).height() ) // Max height
};

app.onDeviceReady = function()
{
	app.showInfo('Activate the SensorTag and tap Start.');
};

app.showInfo = function(info)
{
	document.getElementById('info').innerHTML = info;
};

app.onStartButton = function()
{
	app.onStopButton();
	app.startScan();
	app.showInfo('Status: Scanning...');
	app.startConnectTimer();
};

app.onStopButton = function()
{
	// Stop any ongoing scan and close devices.
	app.stopConnectTimer();
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();
	app.showInfo('Status: Stopped.');
};

app.onResetButton = function()
{
	app.resetData();
};

app.onLogButton = function()
{
	app.logData();
};

app.onBrokenButton = function()
{
	document.getElementById('broken').innerHTML = "broken";
	app.tableData[4]['maxValue'] = 1;
	app.onLogButton();
};

app.onNotBrokenButton = function()
{
	document.getElementById('broken').innerHTML = "not broken";
	app.tableData[4]['maxValue'] = 0;
	app.onLogButton();
};

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
		app.sensortag.HUMIDITY_SERVICE,
		app.sensortag.TEMPERATURE_SERVICE,
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
			app.updateTable();
			app.drawDiagram(values);
		},
		function(errorCode)
		{
			console.log('Error: enableNotification: ' + errorCode + '.');
		});

//humidity

	// Set humidity configuration to ON.
	device.writeCharacteristic(
		app.sensortag.HUMIDITY_CONFIG,
		new Uint8Array([1]),
		function()
		{
			console.log('humidity config');
		},
		app.fail);

	// Set humidity period to 100 ms.
	device.writeCharacteristic(
		app.sensortag.HUMIDITY_PERIOD,
		new Uint8Array([10]),
		function()
		{
			console.log('humidity period');
		},
		app.fail);

	// Set humidity notification to ON.
	device.writeDescriptor(
		app.sensortag.HUMIDITY_DATA,
		app.sensortag.HUMIDITY_NOTIFICATION, // Notification descriptor.
		new Uint8Array([1,0]),
		function()
		{
			console.log('humidity notification');
		},
		app.fail);

	// Start humidity notification.
	device.enableNotification(
		app.sensortag.HUMIDITY_DATA,
		function(data)
		{
			app.showInfo('Status: Data stream active - humidity');
			console.log('Status: Data stream active - humidity');
			var dataArray = new Uint8Array(data);
			var values = app.getHumidityValues(dataArray);
			app.updateMapHumidity(values);
			app.updateTable();
		},
		app.fail);

//temperature

	device.writeCharacteristic(
		app.sensortag.TEMPERATURE_CONFIG,
		new Uint8Array([1]),
		app.success,
		app.fail);

	// Set accelerometer period to 100 ms.
	device.writeCharacteristic(
		app.sensortag.TEMPERATURE_PERIOD,
		new Uint8Array([10]),
		app.success,
		app.fail);

	// Set accelerometer notification to ON.
	device.writeDescriptor(
		app.sensortag.TEMPERATURE_DATA,
		app.sensortag.TEMPERATURE_NOTIFICATION, // Notification descriptor.
		new Uint8Array([1,0]),
		app.success,
		app.fail);

	// Start accelerometer notification.
	device.enableNotification(
		app.sensortag.TEMPERATURE_DATA,
		function(data)
		{
			var dataArray = new Uint8Array(data);
			var values = app.getTemperatureValues(dataArray);
			app.updateMapTemperature(values);
			app.updateTable();
		},
		app.fail);

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

/**
 * Calculate humidity values from raw data.
 * @param data - an Uint8Array.
 * @return Object with fields: humidityTemperature, relativeHumidity.
 * @instance
 * @public
 */
app.getHumidityValues = function(data)
{
	// Calculate the humidity temperature (Celsius).
	var tData = evothings.util.littleEndianToInt16(data, 0)
	var tc = -46.85 + 175.72 / 65536.0 * tData

	// Calculate the relative humidity.
	var hData = (evothings.util.littleEndianToInt16(data, 2) & ~0x03)
	var h = -6.0 + 125.00 / 65536.0 * hData

	// Return result.
	return { humidityTemperature: tc, relativeHumidity: h }
}

app.getTemperatureValues = function(data)
{
	// Calculate ambient temperature (Celsius).
	var ac = evothings.util.littleEndianToUint16(data, 2) / 128.0

	// Calculate target temperature (Celsius).
	var tc = evothings.util.littleEndianToInt16(data, 0)
	tc = (tc >> 2) * 0.03125

	// Return result.
	return { ambientTemperature: ac, targetTemperature: tc }
}


/**
 * Plot diagram of sensor values.
 * Values plotted are expected to be between -1 and 1
 * and in the form of objects with fields x, y, z.
 */
app.drawDiagram = function(values)
{
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	// Add recent values.
	app.dataPoints.push(values);

	// Remove data points that do not fit the canvas.
	if (app.dataPoints.length > canvas.width)
	{
		app.dataPoints.splice(0, (app.dataPoints.length - canvas.width));
	}

	// Value is an accelerometer reading between -1 and 1.
	function calcDiagramY(value)
	{
		// Return Y coordinate for this value.
		var diagramY =
			((value * canvas.height) / 4)
			+ (canvas.height / 2);
		return diagramY;
	}

	function drawLine(axis, color)
	{
		context.strokeStyle = color;
		context.beginPath();
		var lastDiagramY = calcDiagramY(
			app.dataPoints[app.dataPoints.length-1][axis]);
		context.moveTo(0, lastDiagramY);
		var x = 1;
		for (var i = app.dataPoints.length - 2; i >= 0; i--)
		{
			var y = calcDiagramY(app.dataPoints[i][axis]);
			context.lineTo(x, y);
			x++;
		}
		context.stroke();
	}

	// Clear background.
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw lines.
	drawLine('x', '#f00');
	drawLine('y', '#0f0');
	drawLine('z', '#00f');
};

/**
 * Update table of sensor values.
 * Values are expected to be between -1 and 1
 * and in the form of objects with fields x, y, z.
 */
app.updateTable = function(values)
{
	var table = document.getElementById('table');

    function loadTable(tableId, fields, data) {
        //$('#' + tableId).empty(); //not really necessary
        var rows = '';
        $.each(data, function(index, item) {
            var row = '<tr>';
            $.each(fields, function(index, field) {
                row += '<td>' + item[field+''] + '</td>';
            });
            rows += row + '</tr>';
        });
		var table = document.getElementById('table');
        $('#' + 'table' + ' tbody').html(rows);
    }
    
    loadTable('table', ['sensorName', 'currentValue', 'maxValue'], app.tableData);
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

app.updateMapHumidity = function(values) {
	/*app.tableData[4]['currentValue'] = values.humidityTemperature.toFixed(4);
	app.tableData[5]['currentValue'] = values.relativeHumidity.toFixed(4);

	if (app.tableData[4]['maxValue'] <= Math.abs(values.humidityTemperature))
	{
		app.tableData[4]['maxValue'] = Math.abs(values.humidityTemperature.toFixed(4));
	}
	if (app.tableData[5]['maxValue'] <= Math.abs(values.relativeHumidity))
	{
		app.tableData[5]['maxValue'] = Math.abs(values.relativeHumidity.toFixed(4));
	}*/
};


app.updateMapTemperature = function(values) {
	/*app.tableData[6]['currentValue'] = values.ambientTemperature.toFixed(4);

	if (app.tableData[6]['maxValue'] <= Math.abs(values.ambientTemperature))
	{
		app.tableData[6]['maxValue'] = Math.abs(values.ambientTemperature.toFixed(4));
	}*/
};

app.keyPressHandler = function(values)
{
	if (values[0] == 3)
	{
		app.resetData();
	}
};

app.resetData = function(test)
{
	app.dataPoints.length = 0;
	app.tableData[0]['currentValue'] = 0;
	app.tableData[1]['currentValue'] = 0;
	app.tableData[2]['currentValue'] = 0;
	app.tableData[4]['currentValue'] = 0;
	app.tableData[3]['maxValue'] = 0;
	app.tableData[0]['maxValue'] = 0;
	app.tableData[1]['maxValue'] = 0;
	app.tableData[2]['maxValue'] = 0;
	app.tableData[3]['maxValue'] = 0;
	app.tableData[4]['maxValue'] = 0;
	document.getElementById('broken').innerHTML = "not broken";
};

app.logData = function()
{

	function gotFS(fileSystem) {
	    fileSystem.root.getFile("logData.csv", {create: true, exclusive: false}, gotFileEntry, fail);
	}

	function gotFileEntry(fileEntry) {
		console.log(fileEntry.fullPath);
	    fileEntry.createWriter(gotFileWriter, fail);
	}

	function gotFileWriter(writer) {
	    writer.onwriteend = function(evt) {
	        console.log("written to file");
	    };

		writer.seek(writer.length);
	    writer.write(collectData());
	}

	function collectData()
	{
		var string = "";
		string += app.tableData[0]['maxValue'] + ",";
		string += app.tableData[1]['maxValue'] + ",";
		string += app.tableData[2]['maxValue'] + ",";
		string += app.tableData[3]['maxValue'] + ",";
		string += app.tableData[4]['maxValue'];
		string += "\n";

		return string;
	}

    function fail(error) {
        console.log(error.code);
    }

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

}

// Initialize the app.
app.initialize();
