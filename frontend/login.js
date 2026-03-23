document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerHTML = ""; // Clear previous errors

    // Validation
    if (!username || !password || !role) {
        showError("Please fill in all fields");
        return;
    }

    try {
        // Send login request to backend
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Store token in localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("username", username);

        // Show success message
        showSuccess("✅ Login successful! Redirecting...");

        // Redirect based on role
        setTimeout(() => {
            if (role === "owner") {
                window.location.href = "owner-dashboard.html";
            } else if (role === "staff") {
                window.location.href = "billing.html";
            }
        }, 1000);

    } catch (error) {
        showError("❌ " + error.message);
        console.error("Login error:", error);
    }
});

function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.innerHTML = message;
    errorDiv.className = "error-msg";
    errorDiv.style.display = "block";
}

function showSuccess(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.innerHTML = message;
    errorDiv.className = "success-msg";
    errorDiv.style.display = "block";
}

// Keep login page as entry page, even if old token exists.
// Navigation to dashboards should happen only after explicit login submit.