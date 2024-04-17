# hookcookie
This is a Node.js project I created, which essentially performs the same function as Webhook.site but offers improvements

# Access the Local Server:

1. Open your web browser and navigate to localhost:3000/{anything-you-want}. Replace {anything-you-want} with any desired path or identifier.

# Send a Request

2. Make a post request to the URL you opened in step 1. This action will generate a special ID for your request. Append Request ID:

3. After receiving the special ID, append it to the URL in the following format: localhost:3000/{anything-you-want}/read/{request_id}. Replace {request_id} with the ID you received in step 2.

# Retrieve Content:

Now, you can send a GET request to the appended URL to fetch the content associated with that request ID.
