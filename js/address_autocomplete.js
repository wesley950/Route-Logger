var current_deliver_address_field = null
var deliver_address_fields = []
var last_query = ""
var suggestion_lists = {}

function find_deliver_address_fields() {
    const deliver_address_fields = []

    for (let i = 1; i <= 4; i++) {
        deliver_address_fields.push(document.getElementById(`address-field-${i}`))
    }

    return deliver_address_fields
}


function destroy_suggestion_list(deliver_address_field) {
    let suggestion_list = suggestion_lists[deliver_address_field.id]

    if (suggestion_list) {
        suggestion_list.remove()
        suggestion_lists[deliver_address_field.id] = null
    }
}


deliver_address_fields = find_deliver_address_fields()
deliver_address_fields.forEach(element => {
    element.addEventListener('focusin', (event) => {
        current_deliver_address_field = event.target
        last_query = current_deliver_address_field.value
    })
})


function autocomplete(query) {
    var request_options = {
        method: 'GET'
    }

    if (query == '') {
        destroy_suggestion_list(current_deliver_address_field)
        return
    }

    fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=8262c9d22393494cbfa3775c40acc72a`)
        .then(response => response.json())
        .then((result) => {
            let suggestions = []
            result.features.forEach(feature => {
                suggestions.push(feature.properties.formatted)
            })

            destroy_suggestion_list(current_deliver_address_field)

            let suggestion_list = create_suggestion_list(current_deliver_address_field.parentNode, suggestions)
            suggestion_lists[current_deliver_address_field.id] = suggestion_list.container_element

            let unordered_list_element = suggestion_list.unordered_list_element
            unordered_list_element.childNodes.forEach(childNode => {
                childNode.addEventListener('click', (event) => {
                    current_deliver_address_field.value = childNode.firstChild.textContent.replace(', United States of America', '')
                    last_query = current_deliver_address_field.value
                    suggestion_list.container_element.remove()
                })
            })
        })
        .catch(error => console.error('error', error))
}


setInterval(() => {
    if (current_deliver_address_field == null)
        return;

    if (current_deliver_address_field.value != last_query) {
        last_query = current_deliver_address_field.value
        autocomplete(last_query)
    } else {
        console.log('still the same!')
    }
}, 1000);