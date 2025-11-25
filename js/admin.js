// =======================
// Przełączanie zakładek
// =======================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        document.getElementById(btn.dataset.tab).classList.remove('hidden');
    });
});

// =======================
// DOMContentLoaded
// =======================
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem("jwt")?.trim();
    if (!token) return;

    try {
        const response = await fetch('https://studentpanel-sw-dm.onrender.com/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const user = await response.json();
        console.log(user);

        if (user.type === 'lektor') {
            document.querySelectorAll('.menu-lektor')
                .forEach(el => el.style.display = 'block');
        }

        // Załaduj dane po wczytaniu DOM i sprawdzeniu tokena
        await loadLectors();
        await loadStudentLogins();

    } catch (e) {
        console.error("Błąd pobierania roli:", e);
    }
});

// =======================
// Ładowanie listy lektorów
// =======================
async function loadLectors() {
    try {
        const token = localStorage.getItem("jwt")?.trim();
        const resp = await fetch('https://studentpanel-sw-dm.onrender.com/api/admin/lectors', {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const lectors = await resp.json();
        const tbody = document.getElementById('lectorsTable');
        tbody.innerHTML = '';

        lectors.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${l.id}</td><td>${l.imie}</td><td>${l.nazwisko}</td><td>${l.adres}</td>
                <td>${l.telefon}</td><td>${l.umowaOd}</td><td>${l.umowaDo}</td><td>${l.login}</td>
                <td>
                    <button class="action-btn edit-btn">Edytuj</button>
                    <button class="action-btn delete-btn">Usuń</button>
					<button class="action-btn reset-pass-btn">Resetuj hasło</button>
                </td>
            `;
            tbody.appendChild(tr);

            // DELETE
            tr.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm(`Czy na pewno chcesz usunąć lektora ${l.imie} ${l.nazwisko}?`)) {
                    const resp = await fetch(`https://studentpanel-sw-dm.onrender.com/api/admin/lectors/${l.id}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (resp.status === 204) {
                        alert("Lektor usunięty");
                        await loadLectors();
                    } else {
                        alert("Błąd podczas usuwania lektora");
                    }
                }
            });
			

			// RESET PASSWORD
			tr.querySelector('.reset-pass-btn').addEventListener('click', async () => {
				console.log("pass")
				const newPass = prompt(`Podaj nowe hasło dla ${l.imie} ${l.nazwisko}:`);
	
				if (!newPass || newPass.trim() === "") {
				alert("Hasło nie może być puste!");
				return;
				}

			const resp = await fetch(`https://studentpanel-sw-dm.onrender.com/api/admin/lectors/${l.id}/reset-password`, {
			method: "PUT",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ password: newPass })
			
    });

    if (resp.ok) {
        alert("Hasło zostało zresetowane");
    } else {
        alert("Błąd podczas resetowania hasła");
    }
});
			
            // EDIT
            tr.querySelector('.edit-btn').addEventListener('click', () => openEditModal(l));
        });

    } catch (e) {
        console.error("Błąd podczas ładowania lektorów:", e);
    }
}

// =======================
// Ładowanie loginów uczniów
// =======================
async function loadStudentLogins() {
    try {
        const token = localStorage.getItem("jwt")?.trim();
        const resp = await fetch('https://studentpanel-sw-dm.onrender.com/api/admin/studentLogins', {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const students = await resp.json();
        const tbody = document.getElementById('studentLoginsTable');
        tbody.innerHTML = '';
        students.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.id}</td><td>${s.imie}</td><td>${s.nazwisko}</td><td>${s.login}</td>
                <td>
                    <button class="action-btn edit-btn">Edytuj</button>
                </td>
            `;
            tbody.appendChild(tr);
        });


    } catch (e) {
        console.error("Błąd podczas ładowania loginów uczniów:", e);
    }
}

// =======================
// Modal i formularz
// =======================
const modal = document.getElementById('modal');
const modalForm = document.getElementById('modalForm');
let editingLectorId = null;

function openEditModal(lector) {
    editingLectorId = lector.id;
    document.getElementById('modalTitle').textContent = 'Edytuj lektora';
    modal.classList.remove('hidden');

    document.getElementById('inputFirstName').value = lector.imie;
    document.getElementById('inputLastName').value = lector.nazwisko;
    document.getElementById('inputAddress').value = lector.adres;
    document.getElementById('inputPhone').value = lector.telefon;
    document.getElementById('inputLogin').value = lector.login;
    document.getElementById('inputPassword').value = ''; // puste jeśli nie zmieniamy
	document.querySelectorAll('.password-field').forEach(el => el.style.display = 'none');
}

modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("jwt")?.trim();

    const lectorData = {
        imie: document.getElementById('inputFirstName').value.trim(),
        nazwisko: document.getElementById('inputLastName').value.trim(),
        adres: document.getElementById('inputAddress').value.trim(),
        telefon: document.getElementById('inputPhone').value.trim(),
        umowaOd: document.getElementById('inputUmowaOd')?.value || null,
        umowaDo: document.getElementById('inputUmowaDo')?.value || null,
        login: document.getElementById('inputLogin').value.trim(),
        haslo: document.getElementById('inputPassword')?.value.trim() || null
    };

    try {
        if (editingLectorId) {
            // PUT - edycja
            const resp = await fetch(`https://studentpanel-sw-dm.onrender.com/api/admin/lectors/${editingLectorId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(lectorData)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            alert("Lektor zaktualizowany");
        } else {
            // POST - dodawanie
            if (!lectorData.imie || !lectorData.nazwisko || !lectorData.login || !lectorData.haslo) {
                alert("Imię, nazwisko, login i hasło są wymagane!");
                return;
            }

            const resp = await fetch("https://studentpanel-sw-dm.onrender.com/api/admin/lectors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(lectorData)
            });
            if (!resp.ok) throw new Error(await resp.text());
            alert("Lektor został dodany!");
        }

        modal.classList.add('hidden');
        editingLectorId = null;
        modalForm.reset();
        await loadLectors();

    } catch (e) {
        console.error(e);
        alert("Błąd: " + e.message);
    }
});

document.getElementById('closeModal').onclick = () => {
    modal.classList.add('hidden');
    editingLectorId = null;
};


