document.addEventListener("DOMContentLoaded", function() {

    fetch('/api/profile/')
        .then(res => {
            if (!res.ok) throw new Error('Помилка авторизації');
            return res.json();
        })
        .then(data => {
            if (data.gender) document.getElementById('gender').value = data.gender;
            if (data.birth_date) document.getElementById('birth_date').value = data.birth_date;
            if (data.height) document.getElementById('height').value = data.height;
            if (data.target_weight) document.getElementById('target_weight').value = data.target_weight;
            if (data.goal) document.getElementById('goal').value = data.goal;
            if (data.activity_level) document.getElementById('activity_level').value = data.activity_level;
        })
        .catch(err => console.log(err));

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

    document.getElementById('profileForm').onsubmit = function(e) {
        e.preventDefault();

        const body = {
            gender: document.getElementById('gender').value,
            birth_date: document.getElementById('birth_date').value,
            height: document.getElementById('height').value,
            target_weight: document.getElementById('target_weight').value,
            goal: document.getElementById('goal').value,
            activity_level: document.getElementById('activity_level').value,
        };

        const csrftoken = getCookie('csrftoken');

        fetch('/api/profile/', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(body)
        }).then(res => {
            if (res.ok) {
                window.location.href = '/';
            } else {
                alert('Помилка при збереженні. Перевір введені дані.');
            }
        });
    };
});