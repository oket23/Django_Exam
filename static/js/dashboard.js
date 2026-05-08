document.addEventListener("DOMContentLoaded", function() {

    const $ = (id) => document.getElementById(id);

    function getToken(name) {
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

    const csrftoken = getToken('csrftoken');

    let viewDate = new Date();
    let chartInstance = null;
    let editState = { type: null, id: null };
    let deleteState = { type: null, id: null };

    function getFormattedDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function updateDateLabel() {
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const viewDateOnly = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate());

        const diffDays = Math.round((todayDateOnly - viewDateOnly) / (1000 * 60 * 60 * 24));
        const dateDisplay = $('displayDate');

        if (dateDisplay) {
            if (diffDays === 0) dateDisplay.innerText = "Сьогодні";
            else if (diffDays === 1) dateDisplay.innerText = "Вчора";
            else dateDisplay.innerText = viewDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
        }
    }

    function loadDashboard() {
        const dateStr = getFormattedDate(viewDate);
        updateDateLabel();

        fetch(`/api/dashboard/?date=${dateStr}`)
            .then(res => res.ok ? res.json() : Promise.reject('Не авторизовано'))
            .then(data => {
                if (data.profile && data.profile.is_complete === false && typeof showToast === 'function') {
                    showToast('Будь ласка, заповни профіль для точних розрахунків', 'error');
                }

                const safeSet = (id, val) => { if($(id)) $(id).innerText = val; };

                safeSet('card_water', `${data.today_summary.consumed_water} мл`);
                safeSet('card_water_goal', `ціль: ${data.dynamic_goals_today.target_water} мл`);
                safeSet('card_burned', `${data.today_summary.burned_calories}`);
                safeSet('card_consumed', `${data.today_summary.consumed_calories}`);
                safeSet('card_cal_goal', `ціль: ${data.dynamic_goals_today.target_calories} ккал`);
                safeSet('card_weight', `${data.profile.current_weight || '--'}`);

                const pCurr = $('curr_p'), pGoal = $('goal_p');
                const fCurr = $('curr_f'), fGoal = $('goal_f');
                const cCurr = $('curr_c'), cGoal = $('goal_c');

                if (pCurr && pGoal && fCurr && fGoal && cCurr && cGoal) {
                    pCurr.innerText = Math.round(data.today_summary.consumed_protein);
                    pGoal.innerText = Math.round(data.dynamic_goals_today.target_protein);
                    fCurr.innerText = Math.round(data.today_summary.consumed_fat);
                    fGoal.innerText = Math.round(data.dynamic_goals_today.target_fat);
                    cCurr.innerText = Math.round(data.today_summary.consumed_carbs);
                    cGoal.innerText = Math.round(data.dynamic_goals_today.target_carbs);

                    const checkColor = (curr, goal, el) => {
                        el.classList.toggle('text-danger', curr > goal);
                        el.classList.toggle('text-success', curr <= goal);
                    };
                    checkColor(data.today_summary.consumed_protein, data.dynamic_goals_today.target_protein, pCurr);
                    checkColor(data.today_summary.consumed_fat, data.dynamic_goals_today.target_fat, fCurr);
                    checkColor(data.today_summary.consumed_carbs, data.dynamic_goals_today.target_carbs, cCurr);
                }

                let tableHTML = '';
                if (data.logs_today.food.length) {
                    data.logs_today.food.forEach(item => {
                        const safeName = item.meal_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        tableHTML += `<tr>
                            <td><strong style="color:#e67e22;">🍔 Їжа</strong></td>
                            <td>${item.meal_name}</td><td>${item.calories} ккал</td>
                            <td>
                                <span class="action-link text-edit" onclick="openEditFood(${item.id}, '${safeName}', ${item.calories}, ${item.protein || 0}, ${item.fats || 0}, ${item.carbs || 0})">Ред</span>
                                <span class="action-link text-delete" onclick="confirmDelete('food', ${item.id})">Видалити</span>
                            </td></tr>`;
                    });
                }
                if (data.logs_today.activity.length) {
                    data.logs_today.activity.forEach(item => {
                        let typeUa = item.activity_type === 'gym' ? 'Силове' : (item.activity_type === 'cardio' ? 'Кардіо' : 'Інше');
                        tableHTML += `<tr>
                            <td><strong style="color:#9b59b6;">🏃 Тренування</strong></td>
                            <td>${typeUa} (${item.duration_minutes} хв)</td><td style="color: #2ecc71;">+${item.calories_burned} ккал</td>
                            <td>
                                <span class="action-link text-edit" onclick="openEditActivity(${item.id}, '${item.activity_type}', ${item.duration_minutes})">Ред</span>
                                <span class="action-link text-delete" onclick="confirmDelete('activity', ${item.id})">Видалити</span>
                            </td></tr>`;
                    });
                }
                if (data.logs_today.water.length) {
                    data.logs_today.water.forEach(item => {
                        tableHTML += `<tr>
                            <td><strong style="color:#3498db;">💧 Вода</strong></td>
                            <td>Вживання води</td><td>${item.amount_ml} мл</td>
                            <td><span class="action-link text-delete" onclick="confirmDelete('water', ${item.id})">Видалити</span></td>
                        </tr>`;
                    });
                }
                if (!tableHTML) tableHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Поки що немає записів за цю дату</td></tr>';
                const tBody = $('history-table-body');
                if(tBody) tBody.innerHTML = tableHTML;

                const history = data.charts.weight_history;
                if (history && history.length > 0 && typeof Chart !== 'undefined') {
                    const canvas = $('weightChart');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (chartInstance) chartInstance.destroy();
                        chartInstance = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: history.map(i => i.date),
                                datasets: [{ label: 'Вага (кг)', data: history.map(i => parseFloat(i.weight)), borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.2)', borderWidth: 4, pointBackgroundColor: '#fff', pointRadius: 5, fill: true, tension: 0.4 }]
                            },
                            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: Math.min(...history.map(i => parseFloat(i.weight))) - 2, max: Math.max(...history.map(i => parseFloat(i.weight))) + 2 } } }
                        });
                    }
                }
            })
            .catch(err => console.error("Помилка завантаження дашборду:", err));
    }

    $('btnPrevDate')?.addEventListener('click', () => { viewDate.setDate(viewDate.getDate() - 1); loadDashboard(); });
    $('btnNextDate')?.addEventListener('click', () => { viewDate.setDate(viewDate.getDate() + 1); loadDashboard(); });

    const modalChoice = $('modalActionChoice');
    const modalFood = $('modalFood');
    const modalActivity = $('modalActivity');
    const customConfirm = $('customConfirmModal');

    $('mainAddBtn')?.addEventListener('click', () => { if(modalChoice) modalChoice.style.display = 'flex'; });

    $('btnChoiceFood')?.addEventListener('click', () => {
        if(modalChoice) modalChoice.style.display = 'none';
        editState = { type: null, id: null };
        $('formFood')?.reset();
        if($('modalFoodTitle')) $('modalFoodTitle').innerText = 'Додати прийом їжі';
        if($('submitFoodBtn')) $('submitFoodBtn').innerText = 'ЗБЕРЕГТИ';
        if(modalFood) modalFood.style.display = 'flex';
    });

    $('btnChoiceActivity')?.addEventListener('click', () => {
        if(modalChoice) modalChoice.style.display = 'none';
        editState = { type: null, id: null };
        $('formActivity')?.reset();
        if($('modalActivityTitle')) $('modalActivityTitle').innerText = 'Додати тренування';
        if($('submitActivityBtn')) $('submitActivityBtn').innerText = 'ЗБЕРЕГТИ';
        if(modalActivity) modalActivity.style.display = 'flex';
    });

    window.addEventListener('click', (e) => {
        if ([modalChoice, modalFood, modalActivity, customConfirm].includes(e.target) && e.target !== null) {
            e.target.style.display = 'none';
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if(modal) modal.style.display = 'none';
        });
    });

    window.openEditFood = (id, name, cal, p, f, c) => {
        editState = { type: 'food', id: id };
        if($('food_name')) $('food_name').value = name;
        if($('food_cal')) $('food_cal').value = cal;
        if($('food_p')) $('food_p').value = p || 0;
        if($('food_f')) $('food_f').value = f || 0;
        if($('food_c')) $('food_c').value = c || 0;
        if($('modalFoodTitle')) $('modalFoodTitle').innerText = 'Редагувати їжу';
        if($('submitFoodBtn')) $('submitFoodBtn').innerText = 'ОНОВИТИ';
        if (modalFood) modalFood.style.display = 'flex';
    };

    window.openEditActivity = (id, type, duration) => {
        editState = { type: 'activity', id: id };
        if($('act_type')) $('act_type').value = type;
        if($('act_duration')) $('act_duration').value = duration;
        if($('modalActivityTitle')) $('modalActivityTitle').innerText = 'Редагувати тренування';
        if($('submitActivityBtn')) $('submitActivityBtn').innerText = 'ОНОВИТИ';
        if (modalActivity) modalActivity.style.display = 'flex';
    };

    window.confirmDelete = (type, id) => {
        deleteState = { type: type, id: id };
        if (customConfirm) {
            customConfirm.style.display = 'flex';
        } else {
            if (confirm("Видалити запис?")) executeDelete();
        }
    };

    function executeDelete() {
        if (!deleteState.id) return;
        fetch(`/api/${deleteState.type}/${deleteState.id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken }
        }).then(res => {
            if (res.ok) {
                if (typeof showToast === 'function') showToast('Запис видалено');
                if (customConfirm) customConfirm.style.display = 'none';
                loadDashboard();
            }
        });
    }

    $('btnConfirmDelete')?.addEventListener('click', executeDelete);
    $('btnCancelDelete')?.addEventListener('click', () => { if (customConfirm) customConfirm.style.display = 'none'; });

    $('btnFastWater')?.addEventListener('click', () => {
        fetch('/api/water/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ amount_ml: 250, date: getFormattedDate(viewDate) })
        }).then(res => {
            if (res.ok) {
                if (typeof showToast === 'function') showToast('Додано 250 мл води');
                if (modalChoice) modalChoice.style.display = 'none';
                loadDashboard();
            }
        });
    });

    $('formFood')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = editState.id ? `/api/food/${editState.id}/` : '/api/food/';
        fetch(url, {
            method: editState.id ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({
                date: getFormattedDate(viewDate),
                meal_name: $('food_name') ? $('food_name').value : '',
                calories: $('food_cal') ? $('food_cal').value : 0,
                protein: $('food_p') ? $('food_p').value || 0 : 0,
                fats: $('food_f') ? $('food_f').value || 0 : 0,
                carbs: $('food_c') ? $('food_c').value || 0 : 0
            })
        }).then(res => {
            if (res.ok) {
                if (typeof showToast === 'function') showToast('Збережено');
                if (modalFood) modalFood.style.display = 'none';
                loadDashboard();
            }
        });
    });

    $('formActivity')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = editState.id ? `/api/activity/${editState.id}/` : '/api/activity/';
        fetch(url, {
            method: editState.id ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({
                date: getFormattedDate(viewDate),
                activity_type: $('act_type') ? $('act_type').value : '',
                duration_minutes: $('act_duration') ? $('act_duration').value : 0
            })
        }).then(res => {
            if (res.ok) {
                if (typeof showToast === 'function') showToast('Збережено');
                if (modalActivity) modalActivity.style.display = 'none';
                loadDashboard();
            }
        });
    });

    loadDashboard();
});