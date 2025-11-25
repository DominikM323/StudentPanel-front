document.addEventListener("DOMContentLoaded", () => {
document.getElementById("loginForm").addEventListener("submit",async function(e) {
    e.preventDefault();

    const loginData = {
        username: document.getElementById("login").value,
        password: document.getElementById("password").value
    };

    const response = await fetch("https://studentpanel-sw-dm.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
    });

    if (response.ok) {
		
        const data = await response.json();
        const token = data.token;
		console.log("Otrzymany token:", data);
        // Zapamiętujemy token w pamięci przeglądarki
        localStorage.setItem("jwt", token);
		localStorage.setItem("login", document.getElementById("login").value)
        window.location.href = "index.html";
    } else {
        alert("Błędne dane logowania");
    }
});
});