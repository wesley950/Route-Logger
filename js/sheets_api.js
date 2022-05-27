/* Summary: Handles everything related to Google Sheet's API */


/* Determines the name of the month based on the number. */
const month_names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]


/* Determines the ID of the sheet based on the month. */
/* const months = {
    'September': '1IZ4Dhq1bcX4q-31pRUYzB1bVJ7gg4iCMWJm96DQ0Dxk',
    'October': '10HrAhjJAdJB3tdb8N26Gu00O1x8z8hR02Q_WVSBU1U8',
    'November': '1uSivT54X7zEt0HMcp93eyIukcxRBO4dl3tKokqWCFbA',
    'December': '1eOZ4I5BeyoBMdIbQxhnyOnRlP4s_RAeK583X8-9K56Y'
} */
/* TEST SPREADSHEETS */
const months = {
    'September': '1IpI97lv3cc3lo7-_P5O9ZkAyXwvYDlZr2Np0X95KZWY',
    'October': '1fcl7RlhAJRSvLuayw3jNIXVKTqEDAVhqCYGouSiYdCE',
    'November': '1gwCowPZKfDuiv1AxwlHJTsq0OTIwmWLYJniN1VSbhaE',
    'December': '1Wwpem_wxLHX4thDnq37zY-cLR-5TwPmFpcAyZETMbCA'
}

/* Determines the day name based on the number. */
const week_days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
]


/* The initial position of the markers based on the 'template'
    sheet. Used to determine where to create the markers and
    what each markerKey field means. */
/* Each number means the row bellow where the new rows of data
    will be inserted. For example, for VA, new rows will be 
    inserted BEFORE, that is, at row 18, the marker. */
const initial_marker_positions = {
    'VA': 4,
    'MA/RI/CT': 21,
    'Other States / Trash #': 27
}


/* NOTE: this was being used to determine the name of the sheet
    based on the given Date object, but since we are now taking
    the pickup date directly from the <select> there is probably
    no more need for this function. */
function sheet_name_from_pickup_date(pickup_date) {
    let week_day = week_days[pickup_date.getDay()]
    let formatted_date = new Intl.DateTimeFormat('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    }).format(pickup_date).replaceAll('/', '-')
    let complete_formatted_date = `${week_day} ${formatted_date}`

    return complete_formatted_date
}


async function sheet_id_from_name(spreadsheet_id, sheet_name) {
    console.log('Searching for sheet with name "' + sheet_name + '"')

    function fail(resolve) {
        console.log('Could not find!')
        resolve(-1)
    }

    let promise = new Promise((resolve, reject) => {
        gapi.client.sheets.spreadsheets.get({
            spreadsheetId: spreadsheet_id
        }).then((response) => {
            let sheets = response['result']['sheets']

            for (let i = 0; i < sheets.length; i++) {
                let sheet = sheets[i]
                let sheet_properties = sheet['properties']

                if (sheet['properties']['title'] == sheet_name) {
                    console.log('Found!')
                    resolve(sheet['properties']['sheetId'])
                    return
                }
            }

            fail(resolve)
        }, (error) => {
            console.log(error)
            fail(resolve)
        })
    })

    let result = await promise
    return result
}


async function create_markers(month, pickup_date) {
    let spreadsheetId = months[month]
    let sheet_name = pickup_date
    let sheetId = await sheet_id_from_name(spreadsheetId, sheet_name)
    let requests = []

    /* For each of the initial positions create one createMetadata request
        and add it to the list. */
    Object.keys(initial_marker_positions).forEach((key) => {
        let value = initial_marker_positions[key]
        let request = {
            "createDeveloperMetadata": {
                "developerMetadata": {
                    "visibility": 'PROJECT',
                    "location": {
                        "dimensionRange": {
                            "dimension": "ROWS",
                            "sheetId": sheetId,
                            "startIndex": value,
                            "endIndex": value + 1
                        }
                    },
                    "metadataKey": key
                }
            }
        }
        requests.push(request)
    })

    let promise = new Promise((resolve, reject) => {
        gapi.client.sheets.spreadsheets.batchUpdate({
            "spreadsheetId": spreadsheetId,
            "resource": {
                "requests": requests
            }
        }).then((result) => {
            resolve(result)
        }, (error) => {
            console.log(error)
            resolve({})
        })
    })

    let result = await promise
    return result
}


async function get_markers(month, pickup_date) {
    let spreadsheetId = months[month]

    let promise = new Promise((resolve, reject) => {
        gapi.client.sheets.spreadsheets.developerMetadata.search({
            "spreadsheetId": spreadsheetId,
            "resource": {
                "dataFilters": [
                    {
                        "developerMetadataLookup": {
                            "locationType": "ROW"
                        }
                    }
                ]
            }
        }).then((response) => {
            resolve(response.result)
        }, (error) => {
            console.log(error)
            resolve({})
        })
    })

    let result = await promise
    return result
}


async function has_markers(month, pickup_date) {
    let result = await get_markers(month, pickup_date)
    if (!result.matchedDeveloperMetadata)
        return false /* In case result is {} */

    /* Search for all required markers. (See initial_marker_positions) */
    let array = Object.keys(initial_marker_positions)
    let sheet_id = await sheet_id_from_name(months[month], pickup_date)

    for (let j = 0; j < array.length; j++) {
        let found = false
        for (let i = 0; i < result.matchedDeveloperMetadata.length; i++) {
            let developerMetadata = result.matchedDeveloperMetadata[i].developerMetadata

            if (developerMetadata['metadataKey'] == array[j] && developerMetadata['location']['dimensionRange']['sheetId'] == sheet_id) {
                found = true
                break
            }
        }

        if (!found) {
            return false
        }
    }

    return true //result.matchedDeveloperMetadata.length >= 3
}


async function range_from_state(month, pickup_date, state) {
    let matched_metadata = null

    console.log('Searching for markers on %s', month)
    let found_markers = await has_markers(month, pickup_date)

    if (!found_markers) {
        console.log('Markers not found. Creating...')
        await create_markers(month, pickup_date)
    }

    matched_metadata = await get_markers(month, pickup_date)

    console.log('Trying to find range for ' + month)

    let row = -1;

    matched_metadata['matchedDeveloperMetadata'].forEach(element => {
        let metadata = element['developerMetadata']

        if ((metadata['metadataKey'] == state) && (state == 'VA')) {
            row = metadata['location']['dimensionRange']['startIndex']
            return
        } else if ((metadata['metadataKey'] == state) && (state == 'MA/RI/CT')) {
            row = metadata['location']['dimensionRange']['startIndex']
            return
        } else if ((metadata['metadataKey'] == state) && (state == 'Other States / Trash #')) {
            row = metadata['location']['dimensionRange']['startIndex']
            return
        }
    });

    if (row == -1) {
        console.log('Could not find row')
        return null
    }

    /* Go back one row. */
    console.log('The row will be ' + row)

    /* This will be used by send_lines() and because of that, the range needs to be 
        adjusted so the linex are inserted in the line that was added. */
    return {
        'range': `'${pickup_date}'!A${row}`,
        'row': row
    }
}


async function insert_rows(month, pickup_date, after, amount) {
    let spreadsheet_id = months[month]
    let sheet_name = pickup_date
    let sheet_id = await sheet_id_from_name(spreadsheet_id, sheet_name)

    console.log(`Trying to insert rows after ${after}`)
    
    if (amount < 1) {
        console.error('Amount cannot be less than 1!')
        return
    }
    
    let result = await gapi.client.sheets.spreadsheets.batchUpdate({
        'spreadsheetId': spreadsheet_id,
        'resource': {
            'requests': [
                {
                    'insertDimension': {
                        'inheritFromBefore': false,
                        'range': {
                            'dimension': 'ROWS',
                            'startIndex': after,
                            'endIndex': after + amount,
                            'sheetId': sheet_id
                        }
                    }
                }
            ]
        }
    }).then((response) => {
        console.log('Success!')
        console.log(response)
    }, (error) => {
        console.error(error)
    })

    return result
}


async function send_lines(lines) {
    console.log('Trying to append ' + lines.length + ' new lines...')

    let sheet_id = months[g_payload.pickup_month]
    let range = await range_from_state(g_payload.pickup_month, g_payload.pickup_day, g_payload.state)

    console.log('The range is ' + range.range)
    
    await insert_rows(g_payload.pickup_month, g_payload.pickup_day, range.row, lines.length)

    let promise = new Promise((resolve, result) => {
        gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: sheet_id,
            range: range.range,
            insertDataOption: 'OVERWRITE',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: lines
            }
        }).then((response) => {
            resolve(response)
        }, (error) => {
            console.error(error)
            resolve(error)
        })
    })

    let result = await promise
    return result
}

document.getElementById('pickup-month-dropdown').addEventListener('change', async (event) => {
    let month = months[event.target.value]
    let promise = gapi.client.sheets.spreadsheets.get({
        'spreadsheetId': month
    }).then((response) => {
        let spreadsheet = response.result
        let sheets = spreadsheet['sheets']

        if (sheets) {
            // removes the current options from pickup-day-dropdown
            let pickup_day_dropdown = document.getElementById('pickup-day-dropdown')
            let current_option = pickup_day_dropdown.lastElementChild

            while (current_option) {
                current_option.remove()
                current_option = pickup_day_dropdown.lastElementChild
            }

            sheets.forEach(sheet => {
                let new_option = document.createElement('option')
                new_option.textContent = sheet['properties']['title']
                pickup_day_dropdown.appendChild(new_option)
            });
        }

        return spreadsheet
    }, (error) => {
        console.error(error)
        return null
    })

    await promise
})

document.getElementById('pickup-month-dropdown').value = 'Pickup Month'
