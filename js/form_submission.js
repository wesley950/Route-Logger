// TODO: RENAME MOST OF THE VARIABLES!

const submit_btn = document.getElementById('submit')
const save_field_names = [
    'broker', 'driver', 'dispatcher'
]
const save_fields = []
const save_data_lists = {}

save_field_names.forEach(save_field_name => {
    let save_field = document.getElementById(`${save_field_name}-name`)
    let saved_data_list = document.getElementById(`saved-${save_field_name}-names`)

    if (save_field) {
        save_fields.push(save_field)
    }

    if (saved_data_list) {
        save_data_lists[save_field.id] = saved_data_list
    }
})

save_fields.forEach(save_field => {
    let suggestion_list = localStorage.getItem(save_field.id)

    if (!suggestion_list)
        return

    let suggestions = suggestion_list.split(', ')
    suggestions.forEach(suggestion => {
        add_option(suggestion, save_data_lists[save_field.id])
    })
})

function add_option(option, data_list) {
    var option_element = document.createElement('option')

    option_element.value = option
    data_list.appendChild(option_element)
}

async function upload_data() {
    let doc_input_1 = g_payload.doc_upload_1
    let doc_input_2 = g_payload.doc_upload_2

    /* Where the uploaded documents are: */
    let file_1_url = ''
    let file_2_url = ''

    /* Upload the documents and get their url's */
    if (doc_input_1.files.length == 1) {
        let file_1 = doc_input_1.files[0]
        let upload_result_1 = await upload_file(file_1)
        file_1_url = upload_result_1.webContentLink
    }
    if (doc_input_2.files.length == 1) {
        let file_2 = doc_input_2.files[0]
        let upload_result_2 = await upload_file(file_2)
        file_2_url = upload_result_2.webContentLink
    }

    /* Builds a 'table' with all of the required information to send
        to the spreadsheet. */
    let lines = []
    let stops = g_payload.stops

    switch (stops) {
        case 4:
            {
                let line3 = []

                line3.push('')
                line3.push('')
                line3.push(g_payload.stops_info[4]['pickup_addr'])
                line3.push(`${g_payload.load_num}`)
                line3.push(`${file_1_url}`)
                line3.push(`${file_2_url}`)
                line3.push(`${g_payload.delv_date}`)
                line3.push(g_payload.carrier_name)
                line3.push(`${g_payload.rate_num}`)
                line3.push(g_payload.driver_name)
                line3.push(g_payload.dispatcher_name)
                line3.push(`${g_payload.stops_info[4]['notes']}`)

                lines.push(line3)
            }

        case 3:
            {
                let line2 = []

                line2.push('')
                line2.push('')
                line2.push(g_payload.stops_info[3]['pickup_addr'])
                line2.push(`${g_payload.load_num}`)
                line2.push(`${file_1_url}`)
                line2.push(`${file_2_url}`)
                line2.push(`${g_payload.delv_date}`)
                line2.push(g_payload.carrier_name)
                line2.push(`${g_payload.rate_num}`)
                line2.push(g_payload.driver_name)
                line2.push(g_payload.dispatcher_name)
                line2.push(`${g_payload.stops_info[3]['notes']}`)

                lines.push(line2)
            }

        default: /* That means 2 stops. */
            {
                let line1 = []

                line1.push(g_payload.broker_name)
                line1.push(g_payload.stops_info[1]['pickup_addr'])
                line1.push(g_payload.stops_info[2]['pickup_addr'])
                line1.push(`${g_payload.load_num}`)
                line1.push(`${file_1_url}`)
                line1.push(`${file_2_url}`)
                line1.push(`${g_payload.delv_date}`)
                line1.push(g_payload.carrier_name)
                line1.push(`${g_payload.rate_num}`)
                line1.push(g_payload.driver_name)
                line1.push(g_payload.dispatcher_name)
                line1.push(`${g_payload.stops_info[1]['notes']}\n${g_payload.stops_info[2]['notes']}`)

                lines.push(line1)

                break;
            }
    }

    lines.reverse()

    send_lines(lines)
}

submit_btn.addEventListener('click', (event) => {
    // First of all, save the repetitive fields in Window.localStorage
    save_fields.forEach(save_field => {
        let value_to_save = save_field.value

        if (value_to_save == '') {
            return
        }

        let suggestion_list = localStorage.getItem(save_field.id)

        if (!suggestion_list)
            suggestion_list = ''

        let exists = (suggestion_list.indexOf(value_to_save) != -1)

        if (!exists) {
            suggestion_list = suggestion_list.concat(`${value_to_save}, `)
        }

        localStorage.setItem(save_field.id, suggestion_list)
        add_option(value_to_save, save_data_lists[save_field.id])
    })

    // First, build the payload info.    
    if (build_payload()) {
        // Secondly, send the required data to google sheets.
        upload_data()

        // Lastly, open the modal with the information from the payload.
        open_info_modal();
    } else {
        log_error('One of the required fields is empty or invalid!')
    }
})

