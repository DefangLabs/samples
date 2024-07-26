document.addEventListener("DOMContentLoaded", function() {
    const chatForm = document.getElementById("chat-form");
    const chatLog = document.getElementById("chat-log");
    const userInput = document.getElementById("user-input");

    chatForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const userMessage = userInput.value;
        if (userMessage.trim() === "") return;

        // Add user message to chat log
        const userDiv = document.createElement("div");
        userDiv.className = "user-message";
        userDiv.textContent = userMessage;
        chatLog.appendChild(userDiv);

        // Clear input
        userInput.value = "";

        // Send user message to the backend
        const response = await fetch("/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question: userMessage })
        });

        const data = await response.json();
        const botMessage = data.response;

        // Add bot response to chat log
        const botDiv = document.createElement("div");
        botDiv.className = "bot-response";
        botDiv.textContent = botMessage;
        chatLog.appendChild(botDiv);

        // Scroll chat log to the bottom
        chatLog.scrollTop = chatLog.scrollHeight;
    });
});
