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

    const csrftoken = getCookie('csrftoken');
    const todayStr = new Date().toISOString().split('T')[0];

    let chartInstance = null;
    let editState = { type: null, id: null };
    let deleteState = { type: null, id: null };

    function loadDashboard() {
        fetch('/api/dashboard/')
            .then(res => res.ok ? res.json() : Promise.reject('Не авторизовано'))
            .then(data => {
                if (data.profile && data.profile.is_complete === false) {
                    showToast('Будь ласка, заповни профіль для точних розрахунків', 'error');
                }

                // 1. ЗАПОВНЕННЯ КАРТОК
                document.getElementById('card_water').innerText = `${data.today_summary.consumed_water} мл`;
                document.getElementById('card_water_goal').innerText = `ціль: ${data.dynamic_goals_today.target_water} мл`;

                document.getElementById('card_burned').innerText = `${data.today_summary.burned_calories}`;

                document.getElementById('card_consumed').innerText = `${data.today_summary.consumed_calories}`;
                document.getElementById('card_cal_goal').innerText = `ціль: ${data.dynamic_goals_today.target_calories} ккал`;

                document.getElementById('card_weight').innerText = `${data.profile.current_weight || '--'}`;

                // ==========================================
                // НОВИЙ КОД: ЗАПОВНЕННЯ БЛОКУ МАКРОНУТРІЄНТІВ (БЖВ)
                // ==========================================
                const pCurr = document.getElementById('curr_p');
                const pGoal = document.getElementById('goal_p');
                const fCurr = document.getElementById('curr_f');
                const fGoal = document.getElementById('goal_f');
                const cCurr = document.getElementById('curr_c');
                const cGoal = document.getElementById('goal_c');

                if (pCurr) {
                    // Встановлюємо значення (округлюємо для кращого вигляду)
                    pCurr.innerText = Math.round(data.today_summary.consumed_protein);
                    pGoal.innerText = Math.round(data.dynamic_goals_today.target_protein);
                    fCurr.innerText = Math.round(data.today_summary.consumed_fat);
                    fGoal.innerText = Math.round(data.dynamic_goals_today.target_fat);
                    cCurr.innerText = Math.round(data.today_summary.consumed_carbs);
                    cGoal.innerText = Math.round(data.dynamic_goals_today.target_carbs);

                    // Логіка кольору: червоний якщо > норми, зелений якщо <=
                    const checkColor = (curr, goal, el) => {
                        if (curr > goal) {
                            el.classList.add('text-danger');
                            el.classList.remove('text-success');
                        } else {
                            el.classList.add('text-success');
                            el.classList.remove('text-danger');
                        }
                    };

                    checkColor(data.today_summary.consumed_protein, data.dynamic_goals_today.target_protein, pCurr);
                    checkColor(data.today_summary.consumed_fat, data.dynamic_goals_today.target_fat, fCurr);
                    checkColor(data.today_summary.consumed_carbs, data.dynamic_goals_today.target_carbs, cCurr);
                }
                // ==========================================

                // 2. ЗАПОВНЕННЯ ТАБЛИЦІ ІСТОРІЇ
                let tableHTML = '';

                // Їжа
                if (data.logs_today && data.logs_today.food && data.logs_today.food.length > 0) {
                    data.logs_today.food.forEach(item => {
                        tableHTML += `<tr>
                            <td><strong style="color:#e67e22;">🍔 Їжа</strong></td>
                            <td>${item.meal_name}</td>
                            <td>${item.calories} ккал</td>
                            <td>
                                <span class="action-link text-edit" onclick="openEditFood(${item.id}, '${item.meal_name.replace(/'/g, "\\'")}', ${item.calories}, ${item.protein}, ${item.fats}, ${item.carbs})">Ред</span>
                                <span class="action-link text-delete" onclick="confirmDelete('food', ${item.id})">Видалити</span>
                            </td>
                        </tr>`;
                    });
                }

                // Тренування
                if (data.logs_today && data.logs_today.activity && data.logs_today.activity.length > 0) {
                    data.logs_today.activity.forEach(item => {
                        let typeUa = item.activity_type === 'gym' ? 'Силове' : (item.activity_type === 'cardio' ? 'Кардіо' : 'Інше');
                        tableHTML += `<tr>
                            <td><strong style="color:#9b59b6;">🏃 Тренування</strong></td>
                            <td>${typeUa} (${item.duration_minutes} хв)</td>
                            <td style="color: #2ecc71;">+${item.calories_burned} ккал</td>
                            <td>
                                <span class="action-link text-edit" onclick="openEditActivity(${item.id}, '${item.activity_type}', ${item.duration_minutes})">Ред</span>
                                <span class="action-link text-delete" onclick="confirmDelete('activity', ${item.id})">Видалити</span>
                            </td>
                        </tr>`;
                    });
                }

                // Вода
                if (data.logs_today && data.logs_today.water && data.logs_today.water.length > 0) {
                    data.logs_today.water.forEach(item => {
                        tableHTML += `<tr>
                            <td><strong style="color:#3498db;">💧 Вода</strong></td>
                            <td>Вживання води</td>
                            <td>${item.amount_ml} мл</td>
                            <td>
                                <span class="action-link text-delete" onclick="confirmDelete('water', ${item.id})">Видалити</span>
                            </td>
                        </tr>`;
                    });
                }

                if (tableHTML === '') {
                    tableHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Поки що немає записів за сьогодні</td></tr>';
                }

                document.getElementById('history-table-body').innerHTML = tableHTML;

                // 3. ГРАФІК ВАГИ
                const history = data.charts.weight_history;
                if (history && history.length > 0) {
                    const labels = history.map(item => item.date);
                    const weights = history.map(item => parseFloat(item.weight));

                    Chart.defaults.color = '#b0b0b0';
                    Chart.defaults.borderColor = '#333';

                    const ctx = document.getElementById('weightChart').getContext('2d');
                    if (chartInstance) chartInstance.destroy();

                    chartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Вага тіла (кг)',
                                data: weights,
                                borderColor: '#2ecc71',
                                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                                borderWidth: 4,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#2ecc71',
                                pointRadius: 5,
                                fill: true,
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: {
                                    min: Math.min(...weights) - 2,
                                    max: Math.max(...weights) + 2,
                                    grid: { color: '#333' }
                                },
                                x: { grid: { display: false } }
                            }
                        }
                    });
                }
            })
            .catch(err => {
                document.querySelector('.container').innerHTML = `<div class="card" style="text-align: center;"><h2 style="color: #e74c3c;">Необхідна авторизація</h2><a href="/login/" class="btn-primary" style="display:inline-block; width:auto;">Увійти</a></div>`;
            });
    }

    loadDashboard();

    // ... решта логіки модальних вікон залишається без змін ...
    const modalChoice = document.getElementById('modalActionChoice');
    const modalFood = document.getElementById('modalFood');
    const modalActivity = document.getElementById('modalActivity');
    const customConfirm = document.getElementById('customConfirmModal');

    const mainFabBtn = document.getElementById('mainAddBtn');
    if (mainFabBtn) {
        mainFabBtn.onclick = () => { modalChoice.style.display = 'flex'; };
    }

    document.getElementById('btnChoiceFood').onclick = () => {
        modalChoice.style.display = 'none';
        editState = { type: null, id: null };
        document.getElementById('formFood').reset();
        document.getElementById('modalFoodTitle').innerText = 'Додати прийом їжі';
        document.getElementById('submitFoodBtn').innerText = 'ЗБЕРЕГТИ';
        modalFood.style.display = 'flex';
    };

    document.getElementById('btnChoiceActivity').onclick = () => {
        modalChoice.style.display = 'none';
        editState = { type: null, id: null };
        document.getElementById('formActivity').reset();
        document.getElementById('modalActivityTitle').innerText = 'Додати тренування';
        document.getElementById('submitActivityBtn').innerText = 'ЗБЕРЕГТИ';
        modalActivity.style.display = 'flex';
    };

    document.getElementById('closeChoice').onclick = () => { modalChoice.style.display = 'none'; };
    document.getElementById('closeFood').onclick = () => { modalFood.style.display = 'none'; };
    document.getElementById('closeActivity').onclick = () => { modalActivity.style.display = 'none'; };

    window.onclick = (e) => {
        if (e.target === modalChoice) modalChoice.style.display = 'none';
        if (e.target === modalFood) modalFood.style.display = 'none';
        if (e.target === modalActivity) modalActivity.style.display = 'none';
        if (e.target === customConfirm) customConfirm.style.display = 'none';
    };

    // ... функції редагування та видалення ...
    window.openEditFood = function(id, name, cal, p, f, c) {
        editState = { type: 'food', id: id };
        document.getElementById('food_name').value = name;
        document.getElementById('food_cal').value = cal;
        document.getElementById('food_p').value = p;
        document.getElementById('food_f').value = f;
        document.getElementById('food_c').value = c;
        document.getElementById('modalFoodTitle').innerText = 'Редагувати їжу';
        document.getElementById('submitFoodBtn').innerText = 'ОНОВИТИ';
        modalFood.style.display = 'flex';
    };

    window.openEditActivity = function(id, type, duration) {
        editState = { type: 'activity', id: id };
        document.getElementById('act_type').value = type;
        document.getElementById('act_duration').value = duration;
        document.getElementById('modalActivityTitle').innerText = 'Редагувати тренування';
        document.getElementById('submitActivityBtn').innerText = 'ОНОВИТИ';
        modalActivity.style.display = 'flex';
    };

    window.confirmDelete = function(type, id) {
        deleteState = { type: type, id: id };
        customConfirm.style.display = 'flex';
    };

    document.getElementById('btnCancelDelete').onclick = () => {
        customConfirm.style.display = 'none';
        deleteState = { type: null, id: null };
    };

    document.getElementById('btnConfirmDelete').onclick = () => {
        if (!deleteState.id) return;
        fetch(`/api/${deleteState.type}/${deleteState.id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken }
        }).then(res => {
            if (res.ok) {
                showToast('Запис видалено');
                customConfirm.style.display = 'none';
                loadDashboard();
            } else {
                showToast('Помилка при видаленні', 'error');
            }
        });
    };

    // ... відправка даних ...
    document.getElementById('btnFastWater').onclick = function() {
        fetch('/api/water/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ amount_ml: 250, date: todayStr })
        }).then(res => {
            if (res.ok) {
                showToast('Додано 250 мл води');
                modalChoice.style.display = 'none';
                loadDashboard();
            } else { showToast('Помилка додавання', 'error'); }
        });
    };

    document.getElementById('formFood').onsubmit = function(e) {
        e.preventDefault();
        const body = {
            date: todayStr,
            meal_name: document.getElementById('food_name').value,
            calories: document.getElementById('food_cal').value,
            protein: document.getElementById('food_p').value || 0,
            fats: document.getElementById('food_f').value || 0,
            carbs: document.getElementById('food_c').value || 0
        };

        const url = editState.id ? `/api/food/${editState.id}/` : '/api/food/';
        const method = editState.id ? 'PATCH' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify(body)
        }).then(res => {
            if (res.ok) {
                showToast('Збережено успішно');
                modalFood.style.display = 'none';
                document.getElementById('formFood').reset();
                loadDashboard();
            } else { showToast('Помилка', 'error'); }
        });
    };

    document.getElementById('formActivity').onsubmit = function(e) {
        e.preventDefault();
        const body = {
            date: todayStr,
            activity_type: document.getElementById('act_type').value,
            duration_minutes: document.getElementById('act_duration').value
        };

        const url = editState.id ? `/api/activity/${editState.id}/` : '/api/activity/';
        const method = editState.id ? 'PATCH' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify(body)
        }).then(res => {
            if (res.ok) {
                showToast('Збережено успішно');
                modalActivity.style.display = 'none';
                document.getElementById('formActivity').reset();
                loadDashboard();
            } else { showToast('Помилка', 'error'); }
        });
    };
});