async function submitForm(event) {
    event.preventDefault();
    const prompt = document.getElementById('prompt').value;
    document.getElementById('reply').innerHTML = "Loading...";
    const response = await fetch('/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({prompt})
    });
    const data = await response.json();
    document.getElementById('reply').innerHTML = data.reply || "No reply found.";
}
