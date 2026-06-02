const chatLog = document.getElementById("chat");
const form = document.getElementById("chat-form");
const messageInput = document.getElementById("message");
const modeSelect = document.getElementById("mode");
const styleSelect = document.getElementById("style");
const modeDescription = document.getElementById("mode-description");
const resetButton = document.getElementById("reset-chat");
const template = document.getElementById("message-template");
const sessionIdText = document.getElementById("session-id");

const modeDescriptions = {
    eliza: "Script-basiert mit Keyword-Prioritaeten und ELIZA-typischen Reassemblies.",
    llm: "Modellbasiert mit konfigurierbarem API-Zugriff, lokal mit Fallback-Antworten.",
};

const modeLabels = {
    eliza: "ELIZA",
    llm: "LLM",
};

let history = [];
let sessionId = null;

function addMessage(role, content, label) {
    const fragment = template.content.cloneNode(true);
    const wrapper = fragment.querySelector(".bubble-wrap");
    const meta = fragment.querySelector(".bubble-meta");
    const bubble = fragment.querySelector(".bubble");
    wrapper.classList.add(role);
    meta.textContent = label;
    bubble.textContent = content;
    chatLog.appendChild(fragment);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function resetChat() {
    history = [];
    sessionId = null;
    chatLog.innerHTML = "";
    sessionIdText.textContent = "noch nicht gestartet";
    addMessage(
        "assistant",
        "Willkommen. Du kannst zwischen ELIZA und dem LLM-Modus wechseln. Diese Demo ersetzt keine professionelle Hilfe.",
        "System"
    );
}

async function sendMessage(event) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) {
        return;
    }

    const mode = modeSelect.value;
    const style = styleSelect.value;
    addMessage("user", message, "Du");
    history.push({ role: "user", content: message });
    messageInput.value = "";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode, style, message, history, session_id: sessionId }),
        });

        if (response.status === 401) {
            window.location.href = "/zugang?error=Bitte+zuerst+Zugriffscode+eingeben";
            return;
        }

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();
        sessionId = data.session_id || sessionId;
        sessionIdText.textContent = sessionId || "noch nicht gestartet";
        addMessage("assistant", data.reply, modeLabels[mode] || "System");
        history.push({ role: "assistant", content: data.reply });
    } catch (_error) {
        addMessage(
            "assistant",
            "Die Anfrage konnte gerade nicht verarbeitet werden. Bitte versuche es erneut.",
            "System"
        );
    }
}

modeSelect.addEventListener("change", () => {
    modeDescription.textContent = modeDescriptions[modeSelect.value];
});

form.addEventListener("submit", sendMessage);
resetButton.addEventListener("click", resetChat);
resetChat();