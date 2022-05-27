var g_payload = {}


function build_payload() {
    // "Both"
    let stops = Number.parseInt(document.getElementById('stops-dropdown').value)
    let carrier_name = document.getElementById('carrier-name').value
    let broker_name = document.getElementById('broker-name').value

    // "Copy screen"
    let has_tarp = document.getElementById('tarp-dropdown').value

    // Google sheets/drive
    let pickup_month = document.getElementById('pickup-month-dropdown').value
    let pickup_day = document.getElementById('pickup-day-dropdown').value
    let state = document.getElementById('state-dropdown').value
    let load_num = document.getElementById('load-num').value
    let delv_date = document.getElementById('delv-date').value
    let rate_num = document.getElementById('rate-num').value
    let driver_name = document.getElementById('driver-name').value
    let dispatcher_name = document.getElementById('dispatcher-name').value
    // Special case
    let doc_upload_1 = document.getElementById('doc-upload-1')
    let doc_upload_2 = document.getElementById('doc-upload-2')

    // Part both and part copy-screen
    let stops_info = {}

    for (let i = 1; i <= stops; i++) {
        let stop = document.getElementById(`stop-${i}`)
        let fields = stop.getElementsByClassName('form-control')

        let comp_name = fields[0].value
        let pickup_addr = fields[1].value
        let notes = fields[2].value

        stops_info[i] = {
            comp_name: comp_name,
            pickup_addr: pickup_addr,
            notes: notes
        }
    }

    g_payload = {
        carrier_name: carrier_name,
        broker_name: broker_name,
        has_tarp: has_tarp,
        stops: stops,
        stops_info: stops_info,

        pickup_month: pickup_month,
        pickup_day: pickup_day,
        state: state,
        load_num: load_num,
        delv_date: delv_date,
        rate_num: rate_num,
        driver_name: driver_name,
        dispatcher_name: dispatcher_name,

        doc_upload_1: doc_upload_1,
        doc_upload_2: doc_upload_2
    }

    return carrier_name != '' && broker_name != '' && has_tarp != 'Tarp?' && !(Number.isNaN(stops)) && pickup_month != 'Pickup Month' && pickup_day != 'Pickup Day' && state != 'State'
}

function log_error(msg) {
    let error_modal = document.getElementById('error-modal')
    let modal = new bootstrap.Modal(error_modal)
    let error_label = document.getElementById('error-modal-text')

    error_label.textContent = msg
    modal.show()
}

function create_suggestion_list(parent_element, suggestions) {
    var container = document.createElement('div')
    var unordered_list = document.createElement('ul')

    container.className = 'container'
    container.appendChild(unordered_list)
    unordered_list.className = 'list-group'

    suggestions.forEach(suggestion => {
        if (!suggestion.endsWith('United States of America')) {
            return;
        }

        var list_item = document.createElement('li')
        var list_item_text = document.createElement('p')

        list_item.className = 'list-group-item'
        list_item.appendChild(list_item_text)
        list_item_text.className = 'text-primary'
        list_item_text.style.cursor = 'pointer'
        list_item_text.textContent = suggestion.replace(', United States of America', '')

        unordered_list.appendChild(list_item)
    });

    parent_element.appendChild(container)
    return {
        container_element: container,
        unordered_list_element: unordered_list
    }
}

function open_info_modal() {
    function create_modal_header(carrier_name, broker_name, has_tarp) {
        let container = document.createElement('div')

        let carrier_span = document.createElement('span')
        let broker_span = document.createElement('span')
        let tarp_span = document.createElement('tarp')

        container.className = 'row mb-5'
        carrier_span.className = 'text-center'
        carrier_span.textContent = `CARRIER: ${carrier_name}`
        broker_span.className = 'text-center'
        broker_span.textContent = `BROKER: ${broker_name}`
        tarp_span.className = 'text-center'
        tarp_span.textContent = `TARP: ${has_tarp}`

        container.appendChild(carrier_span)
        container.appendChild(broker_span)
        container.appendChild(tarp_span)

        return container
    }

    function create_stop(stop_num, comp_name, pickup_addr, notes) {
        let strong_container = document.createElement('div')
        let strong = document.createElement('strong')

        strong_container.className = 'row'
        strong_container.appendChild(strong)
        strong.className = 'text-center'
        strong.textContent = `STOP ${stop_num}`

        let info_container = document.createElement('div')
        let comp_name_span = document.createElement('span')
        let pickup_addr_span = document.createElement('span')
        let notes_span = document.createElement('span')

        info_container.className = 'row mb-5'
        info_container.appendChild(comp_name_span)
        info_container.appendChild(pickup_addr_span)
        info_container.appendChild(notes_span)

        comp_name_span.className = 'text-center'
        comp_name_span.textContent = comp_name
        pickup_addr_span.className = 'text-center'
        pickup_addr_span.textContent = pickup_addr
        notes_span.className = 'text-center'
        notes_span.textContent = notes

        return {
            strong_container_element: strong_container,
            info_container_element: info_container
        }
    }

    let info_modal_element = document.getElementById('copy-info-modal')
    let info_modal = new bootstrap.Modal(info_modal_element)
    let info_modal_body = document.getElementById('info-body')
    let copy_btn = info_modal_body.removeChild(info_modal_body.lastElementChild)

    while (info_modal_body.lastChild) {
        info_modal_body.lastChild.remove()
    }

    let new_info = g_payload
    let modal_header = create_modal_header(new_info.carrier_name, new_info.broker_name, new_info.has_tarp)

    info_modal_body.appendChild(modal_header)

    for (let i = 1; i <= new_info.stops; i++) {
        let stop_info = new_info.stops_info[i]
        let stop_elements = create_stop(i, stop_info.comp_name, stop_info.pickup_addr, stop_info.notes)
        info_modal_body.appendChild(stop_elements.strong_container_element)
        info_modal_body.appendChild(stop_elements.info_container_element)
    }

    copy_btn.onclick = function (event) {
        let text_plain = ''

        text_plain = text_plain.concat(`CARRIER: ${new_info.carrier_name}\n`)
        text_plain = text_plain.concat(`BROKER: ${new_info.broker_name}\n`)
        text_plain = text_plain.concat(`TARP: ${new_info.has_tarp}\n`)
        text_plain = text_plain.concat(`\n\n`)

        for (let i = 1; i <= new_info.stops; i++) {
            let stop_info = new_info.stops_info[i]

            text_plain = text_plain.concat(`STOP ${i}\n`)
            text_plain = text_plain.concat(`\n`)
            text_plain = text_plain.concat(`${stop_info.comp_name}\n`)
            text_plain = text_plain.concat(`${stop_info.pickup_addr}\n`)
            text_plain = text_plain.concat(`${stop_info.notes}\n`)
            text_plain = text_plain.concat(`\n`)
            text_plain = text_plain.concat(`\n`)
        }

        navigator.clipboard.writeText(text_plain)
    }

    info_modal_body.appendChild(copy_btn)
    info_modal.show()

    info_modal_element.addEventListener('hidden.bs.modal', function () {
        location.reload()
    })
}