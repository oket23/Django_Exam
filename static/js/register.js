document.addEventListener("DOMContentLoaded", function() {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    document.getElementById('registerForm').onsubmit = function(e) {
        e.preventDefault();

        const username = document.getElementById('reg_username').value;
        const email = document.getElementById('reg_email').value;
        const password = document.getElementById('reg_password').value;
        const confirm = document.getElementById('reg_confirm_password').value;

        if (password !== confirm) {
            alert('Паролі не збігаються!');
            return;
        }

        const body = {
            username: username,
            email: email,
            password: password
        };

        const csrftoken = getCookie('csrftoken');

        fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(body)
        }).then(res => {
            if (res.ok) {
                alert('Реєстрація успішна! Тепер увійдіть.');
                window.location.href = '/login/';
            } else {
                return res.json().then(err => {
                    alert('Помилка: ' + JSON.stringify(err));
                });
            }
        });
    };
});