




export default function () {// Listen for messages from the main script

    onmessage = async function (event) {
        // Process the data received from the main script

        const { file, type } = event.data;
        const result = await processData(file, type);

        // Send the processed data back to the main script
        postMessage(result);
    };



    function processData(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        const web_url = import.meta.env.BASE_URL;

        let endpoint;

        if (type === "mel") {
            endpoint = "/api/mel-spectrogram/"
        }

        else {
            endpoint = "/api/basic-spectrogram/"
        }

        return fetch(web_url + endpoint, {
            method: "POST",
            body: formData,

        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Error:', error);
                throw error; // Re-throw the error for further handling
            });

    }
}
