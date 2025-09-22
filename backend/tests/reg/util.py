import requests
from requests_oauthlib import OAuth2Session

host_url = 'https://localhost:8080/'
certfile = "./localhost.crt"

def login() -> OAuth2Session:
    url = host_url + 'api/token'
    response = requests.post(
        url=url,
        data={
            "grant_type": "password",
            "username": "testuser",
            "password": "testuserpw"
        },
        verify=certfile
    )

    oauth = OAuth2Session(client_id="testuser", token=response.json())
    oauth.verify = certfile

    return oauth    