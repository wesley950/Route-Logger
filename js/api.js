const CLIENT_ID = '809965857961-k0tv9ks8shjducr48qq3tcr57ne02tr7.apps.googleusercontent.com'
const API_KEY = 'AIzaSyAMmGgfFiIhvNT1-AIpnPIieYVt5cBls4E'
const SCOPE = 'https://www.googleapis.com/auth/drive ' + 
                'https://www.googleapis.com/auth/drive.appdata ' +
                'https://www.googleapis.com/auth/drive.file ' + 
                'https://www.googleapis.com/auth/drive.scripts ' + 
                'https://www.googleapis.com/auth/drive.metadata ' +
                'https://www.googleapis.com/auth/spreadsheets'
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://sheets.googleapis.com/$discovery/rest?version=v4'
]


const auth_btn = document.getElementById('authorise-btn')
const deauth_btn = document.getElementById('deauthorise-btn')
var g_is_signed_in = false


function handle_client_load() {
    gapi.load('client:auth2', init_client)
}


function init_client() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPE
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(update_signedin_status)

        update_signedin_status(gapi.auth2.getAuthInstance().isSignedIn.get())
        auth_btn.onclick = handle_auth_click
        deauth_btn.onclick = handle_deauth_click
    }, function (error) {
        console.log(JSON.stringify(error, null, 2))
    })
}


function update_signedin_status(is_signed_in) {
    let main_div = document.getElementById('main')

    if (is_signed_in) {
        auth_btn.hidden = true
        deauth_btn.hidden = false

        main_div.hidden = false
    } else {
        auth_btn.hidden = false
        deauth_btn.hidden = true

        main_div.hidden = true
    }

    g_is_signed_in = is_signed_in
}


function handle_auth_click(event) {
    gapi.auth2.getAuthInstance().signIn()
}


function handle_deauth_click(event) {
    gapi.auth2.getAuthInstance().signOut()
}
