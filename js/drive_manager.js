/* Summary: Handles everything related to Google Drive's API. */

async function allocate_file(file_name) {
    let promise = new Promise((resolve, reject) => {
        gapi.client.drive.files.create({
            name: file_name,
            fields: 'webContentLink, id'
        }).then((response) => {
            resolve(response.result)
        }, (error) => {
            console.log(error)
            resolve(null)
        })
    })

    return await promise
}


async function upload_file(file) {
    let metadata = {
        name: file.name,
        mimeType: file.type
    }
    let form_data = new FormData()
    form_data.append('metadata', new Blob([JSON.stringify(metadata)],  {
        type: 'application/json'
    }))
    form_data.append('file', file)

    let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=' + escape('webContentLink, id'), {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + gapi.client.getToken().access_token
        }),
        body: form_data
    })

    let result = await response.json()

    return result
}

async function rename_file(file_id, new_name, new_extension) {
    let promise = new Promise((resolve, reject) => {
        gapi.client.drive.files.update({
            fileId: file_id,
            name: new_name,
            extension: new_extension
        }).then((response) => {
            resolve(response.result)
        }, (error) => {
            console.log(error)
            resolve(null)
        })
    })

    return await promise
}