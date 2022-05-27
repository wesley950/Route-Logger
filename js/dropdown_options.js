const dropdowns = []
const dropdown_suffixes = [
    'stops', 'tarp', 'state'
]

dropdown_suffixes.forEach(suffix => {
    dropdowns.push(document.getElementById(`${suffix}-dropdown`))
})

dropdowns[0].onchange = (event) => {
    let stops = Number.parseInt(event.target.value)
    let stop_elements = []

    for (let i = 1; i <= 4; i++) {
        let stop_element = document.getElementById(`stop-${i}`)
        stop_element.hidden = true
        stop_elements.push(stop_element)
    }

    switch (stops) {
        case 4:
            {
                stop_elements[3].hidden = false
            }

        case 3:
            {
                stop_elements[2].hidden = false
            }

        case 2:
            {
                stop_elements[0].hidden = false
                stop_elements[1].hidden = false
            }
    }
}